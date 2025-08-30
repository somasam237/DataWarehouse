// backend/loadData.js
// This script loads data from CIF files into the PostgreSQL database.
// WARNING: The CIF parsing logic here is simplistic and might not handle all complex CIF structures.
// For production-grade parsing, consider a dedicated CIF parsing library.

require('dotenv').config();
const  pool = require('./db'); // Import the database pool
const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');

// Directory where your downloaded .cif files are located
const cifFilesDirectory = path.join(__dirname, '../data/cif_files');
const imagesOutputDir = path.join(__dirname, 'public/protein_images');

// Ensure images directory exists
if (!fs.existsSync(imagesOutputDir)) {
    fs.mkdirSync(imagesOutputDir, { recursive: true });
}

// --- Helper function for basic CIF parsing ---
// This function attempts to extract a single value associated with a tag.
function getCifValue(cifContent, tag) {
    // Regex to find tag followed by space(s) and then the value.
    // Handles single line values, potentially quoted.
    const regex = new RegExp(`^${tag}\\s+(['"]?)([^'";\\n]+)\\1`, 'm');
    const match = cifContent.match(regex);
    if (match && match[2]) {
        return match[2].trim();
    }
    // Handle multi-line values denoted by ';'
    const tagLine = cifContent.match(new RegExp(`^${tag}\\s+;`, 'm'));
    if (tagLine) {
        const startIndex = cifContent.indexOf(tagLine[0]) + tagLine[0].length;
        const endIndex = cifContent.indexOf('\n;', startIndex);
        if (endIndex !== -1) {
            return cifContent.substring(startIndex, endIndex).replace(/\r?\n/g, '').trim();
        }
    }
    return null;
}

// Helper for parsing loop categories (more complex)
function parseCifLoop(cifContent, loopStartTag) {
    const lines = cifContent.split('\n');
    const data = [];
    let inLoop = false;
    let headers = [];
    let headerLineIndex = -1;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        if (line.startsWith(loopStartTag)) {
            inLoop = true;
            headers = [];
            headerLineIndex = i;
            // Read headers
            let j = i + 1;
            while (j < lines.length && lines[j].trim().startsWith('_')) {
                headers.push(lines[j].trim());
                j++;
            }
            i = j - 1; // Move cursor past headers
            continue;
        }

        if (inLoop) {
            if (line === '' || line.startsWith('#')) { // End of loop block or comment
                inLoop = false;
                headers = [];
                continue;
            }

            // Data lines within the loop
            const values = line.split(/\s+/).filter(v => v !== '');

            // Handle potential multi-line string fields within a loop (very basic)
            let parsedValues = [];
            let currentString = '';
            let inQuote = false;
            for (const val of values) {
                if (!inQuote && (val.startsWith("'") || val.startsWith('"'))) {
                    currentString = val.substring(1);
                    inQuote = true;
                    if (val.endsWith("'") || val.endsWith('"')) {
                        currentString = currentString.substring(0, currentString.length - 1);
                        parsedValues.push(currentString);
                        currentString = '';
                        inQuote = false;
                    }
                } else if (inQuote) {
                    currentString += ' ' + val;
                    if (val.endsWith("'") || val.endsWith('"')) {
                        currentString = currentString.substring(0, currentString.length - 1);
                        parsedValues.push(currentString);
                        currentString = '';
                        inQuote = false;
                    }
                } else {
                    parsedValues.push(val);
                }
            }

            if (parsedValues.length === headers.length) {
                const record = {};
                headers.forEach((header, index) => {
                    record[header] = parsedValues[index];
                });
                data.push(record);
            }
        }
    }
    return data;
}

// Generate a PNG image using PyMOL CLI
function generateImageWithPyMOL(cifPath, outPngPath) {
    return new Promise((resolve) => {
        const pymolArgs = [
            '-cq',
            '-d',
            `load "${cifPath}"; hide everything; show cartoon; bg_color white; set ray_opaque_background, off; ray 800,600; png "${outPngPath}"; quit`
        ];
        const child = execFile('pymol', pymolArgs, { windowsHide: true }, (error) => {
            if (error) {
                console.warn('PyMOL rendering failed:', error.message);
                return resolve(false);
            }
            resolve(true);
        });
        // Safety timeout in case PyMOL hangs
        setTimeout(() => {
            try { child.kill(); } catch (_) {}
            resolve(fs.existsSync(outPngPath));
        }, 30000);
    });
}

// Build a reliable RCSB CDN image URL as fallback when CIF lacks one (kept as last resort)
function getRcsbImageUrl(pdbId) {
    if (!pdbId) return null;
    const idLower = pdbId.toLowerCase();
    // For 4-char PDB IDs, directory is the FIRST two characters
    if (idLower.length === 4) {
        const firstTwo = idLower.substring(0, 2);
        return `https://cdn.rcsb.org/images/structures/${firstTwo}/${idLower}/${idLower}.png`;
    }
    // Fallback generic path
    return `https://cdn.rcsb.org/images/structures/${idLower}.png`;
}


async function loadProteins() {
    console.log('Starting data loading process...');
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const files = fs.readdirSync(cifFilesDirectory).filter(file => file.endsWith('.cif'));

        if (files.length === 0) {
            console.warn('No .cif files found in', cifFilesDirectory);
            return;
        }

        for (const file of files) {
            const filePath = path.join(cifFilesDirectory, file);
            const fullCifData = fs.readFileSync(filePath, 'utf8');

            console.log(`Processing file: ${file}`);


            // --- 1. Extract and Insert into 'Protein_Info' table ---
            const pdb_id = getCifValue(fullCifData, '_entry.id') || path.basename(file, '.cif').toUpperCase();
            const title = getCifValue(fullCifData, '_struct.title') || 'No Title Available';
            const classification = (getCifValue(fullCifData, '_struct_keywords.text') || getCifValue(fullCifData, '_struct.pdbx_descriptor') || '').substring(0, 100);
            const organism = (getCifValue(fullCifData, '_entity_src_nat.pdbx_organism_scientific') || getCifValue(fullCifData, '_entity_src_gen.pdbx_organism_scientific') || '').substring(0, 255);
            const expression_system = (getCifValue(fullCifData, '_entity_src_gen.pdbx_gene_src_scientific_name') || '').substring(0, 255);
            const mutations = getCifValue(fullCifData, '_entity_src_gen.pdbx_gene_src_variant') || null;

            // Choose image path: prefer existing PNG, else render via PyMOL, else CDN
            const localPngPath = path.join(imagesOutputDir, `${pdb_id}.png`);
            let image_url_from_cif = getCifValue(fullCifData, '_struct.pdbx_model_image_url') || null;
            let image_url = null;

            // If we already have a local PNG, use it
            if (fs.existsSync(localPngPath)) {
                image_url = `/static/protein_images/${pdb_id}.png`;
            } else {
                // Try PyMOL rendering
                const rendered = await generateImageWithPyMOL(filePath, localPngPath);
                if (rendered && fs.existsSync(localPngPath)) {
                    image_url = `/static/protein_images/${pdb_id}.png`;
                } else if (image_url_from_cif) {
                    image_url = image_url_from_cif;
                } else {
                    image_url = getRcsbImageUrl(pdb_id);
                }
            }

            const deposited_date_str = getCifValue(fullCifData, '_pdbx_database_status.recvd_initial_deposition_date');
            const deposited_date = deposited_date_str && deposited_date_str !== '?' ? new Date(deposited_date_str) : null;
            // Validate the date
            const valid_deposited_date = deposited_date && !isNaN(deposited_date.getTime()) ? deposited_date : null;

            const released_date_str = getCifValue(fullCifData, '_pdbx_database_status.status_code_cs') || getCifValue(fullCifData, '_database_PDB_rev.date_original');
            const released_date = released_date_str && released_date_str !== '?' ? new Date(released_date_str) : null;
            // Validate the date
            const valid_released_date = released_date && !isNaN(released_date.getTime()) ? released_date : null;

            const molecular_weight_str = getCifValue(fullCifData, '_entity.formula_weight');
            const molecular_weight_kDa = molecular_weight_str ? parseFloat(molecular_weight_str) / 1000 : null; // Convert Da to kDa

            const atom_count_str = getCifValue(fullCifData, '_atom_sites.Cartn_x') || getCifValue(fullCifData, '_atom_site.Cartn_x');
            const atom_count = atom_count_str ? fullCifData.split('\n').filter(line => line.includes('ATOM') || line.includes('HETATM')).length : null;

            const residue_count_modeled_str = getCifValue(fullCifData, '_entity_poly.pdbx_seq_one_letter_code_can');
            const residue_count_modeled = residue_count_modeled_str ? residue_count_modeled_str.replace(/\s/g, '').length : null;

            const residue_count_deposited_str = getCifValue(fullCifData, '_entity_poly.pdbx_sequence_length');
            const residue_count_deposited = residue_count_deposited_str ? parseInt(residue_count_deposited_str) : residue_count_modeled;

            const unique_chains_str = getCifValue(fullCifData, '_entity_poly.pdbx_strand_id');
            const unique_chains = unique_chains_str ? unique_chains_str.split(',').length : 1;

            const global_symmetry = (getCifValue(fullCifData, '_symmetry.space_group_name_H-M') || '').substring(0, 100);
            const global_stoichiometry = (getCifValue(fullCifData, '_pdbx_struct_assembly.oligomeric_details') || '').substring(0, 100);

            // Upsert into Protein_Info table (now with image_url)
            await client.query(
                `INSERT INTO Protein_Info (pdb_id, title, classification, organism, expression_system, mutations, 
                                         deposited_date, released_date, molecular_weight_kDa, atom_count, 
                                         residue_count_modeled, residue_count_deposited, unique_chains, 
                                         global_symmetry, global_stoichiometry, image_url)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
                 ON CONFLICT (pdb_id) DO UPDATE SET
                    title = EXCLUDED.title,
                    classification = EXCLUDED.classification,
                    organism = EXCLUDED.organism,
                    expression_system = EXCLUDED.expression_system,
                    mutations = EXCLUDED.mutations,
                    deposited_date = EXCLUDED.deposited_date,
                    released_date = EXCLUDED.released_date,
                    molecular_weight_kDa = EXCLUDED.molecular_weight_kDa,
                    atom_count = EXCLUDED.atom_count,
                    residue_count_modeled = EXCLUDED.residue_count_modeled,
                    residue_count_deposited = EXCLUDED.residue_count_deposited,
                    unique_chains = EXCLUDED.unique_chains,
                    global_symmetry = EXCLUDED.global_symmetry,
                    global_stoichiometry = EXCLUDED.global_stoichiometry,
                    image_url = EXCLUDED.image_url`,
                [pdb_id, title, classification, organism, expression_system, mutations, 
                 valid_deposited_date, valid_released_date, molecular_weight_kDa, atom_count,
                 residue_count_modeled, residue_count_deposited, unique_chains,
                 global_symmetry, global_stoichiometry, image_url]
            );
            console.log(`  Protein_Info ${pdb_id} processed.`);

            // --- 2. Extract and Insert into 'Authors_Funding' table ---
            await client.query('DELETE FROM Authors_Funding WHERE pdb_id = $1', [pdb_id]);

            let auditAuthorData = parseCifLoop(fullCifData, 'loop_ _audit_author.');
            if (auditAuthorData.length === 0) {
                // Fallback: try to extract single author
                const author_name = getCifValue(fullCifData, '_audit_author.name');
                if (author_name) {
                    auditAuthorData = [{ '_audit_author.name': author_name }];
                }
            }

            const author_names = auditAuthorData.map(author => author['_audit_author.name']).filter(name => name).join(', ');
            const funding_org = getCifValue(fullCifData, '_pdbx_audit_support.funding_organization') || null;
            const funding_location = (getCifValue(fullCifData, '_pdbx_audit_support.country') || '').substring(0, 255);
            const grant_number = (getCifValue(fullCifData, '_pdbx_audit_support.grant_number') || '').substring(0, 100);

            if (author_names || funding_org) {
                await client.query(
                    `INSERT INTO Authors_Funding (pdb_id, author_names, funding_org, funding_location, grant_number)
                     VALUES ($1, $2, $3, $4, $5)`,
                    [pdb_id, author_names || null, funding_org, funding_location, grant_number]
                );
            }
            console.log(`  Authors_Funding for ${pdb_id} processed.`);

            // --- 3. Extract and Insert into 'Experimental_Data' table ---
            await client.query('DELETE FROM Experimental_Data WHERE pdb_id = $1', [pdb_id]);

            const method = (getCifValue(fullCifData, '_exptl.method') || 'UNKNOWN').substring(0, 100);
            const resolution_A_str = getCifValue(fullCifData, '_reflns.d_resolution_high') || getCifValue(fullCifData, '_em_3d_reconstruction.resolution');
            const resolution_A = resolution_A_str ? parseFloat(resolution_A_str) : null;
            
            const r_value_free_depositor_str = getCifValue(fullCifData, '_refine.ls_R_factor_R_free');
            const r_value_free_depositor = r_value_free_depositor_str ? parseFloat(r_value_free_depositor_str) : null;
            
            const r_value_free_dcc_str = getCifValue(fullCifData, '_refine.ls_R_factor_R_free_error');
            const r_value_free_dcc = r_value_free_dcc_str ? parseFloat(r_value_free_dcc_str) : null;
            
            const r_value_work_depositor_str = getCifValue(fullCifData, '_refine.ls_R_factor_R_work');
            const r_value_work_depositor = r_value_work_depositor_str ? parseFloat(r_value_work_depositor_str) : null;
            
            const r_value_work_dcc_str = getCifValue(fullCifData, '_refine.ls_R_factor_R_work_error');
            const r_value_work_dcc = r_value_work_dcc_str ? parseFloat(r_value_work_dcc_str) : null;
            
            const r_value_observed_str = getCifValue(fullCifData, '_refine.ls_R_factor_obs');
            const r_value_observed = r_value_observed_str ? parseFloat(r_value_observed_str) : null;
            
            const space_group = (getCifValue(fullCifData, '_symmetry.space_group_name_H-M') || '').substring(0, 50);
            
            const unit_cell_a_str = getCifValue(fullCifData, '_cell.length_a');
            const unit_cell_a = unit_cell_a_str ? parseFloat(unit_cell_a_str) : null;
            
            const unit_cell_b_str = getCifValue(fullCifData, '_cell.length_b');
            const unit_cell_b = unit_cell_b_str ? parseFloat(unit_cell_b_str) : null;
            
            const unit_cell_c_str = getCifValue(fullCifData, '_cell.length_c');
            const unit_cell_c = unit_cell_c_str ? parseFloat(unit_cell_c_str) : null;
            
            const unit_cell_alpha_str = getCifValue(fullCifData, '_cell.angle_alpha');
            const unit_cell_alpha = unit_cell_alpha_str ? parseFloat(unit_cell_alpha_str) : null;
            
            const unit_cell_beta_str = getCifValue(fullCifData, '_cell.angle_beta');
            const unit_cell_beta = unit_cell_beta_str ? parseFloat(unit_cell_beta_str) : null;
            
            const unit_cell_gamma_str = getCifValue(fullCifData, '_cell.angle_gamma');
            const unit_cell_gamma = unit_cell_gamma_str ? parseFloat(unit_cell_gamma_str) : null;

            await client.query(
                `INSERT INTO Experimental_Data (pdb_id, method, resolution_A, r_value_free_depositor, 
                                              r_value_free_dcc, r_value_work_depositor, r_value_work_dcc, 
                                              r_value_observed, space_group, unit_cell_a, unit_cell_b, 
                                              unit_cell_c, unit_cell_alpha, unit_cell_beta, unit_cell_gamma)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
                 ON CONFLICT (pdb_id) DO UPDATE SET
                    method = EXCLUDED.method,
                    resolution_A = EXCLUDED.resolution_A,
                    r_value_free_depositor = EXCLUDED.r_value_free_depositor,
                    r_value_free_dcc = EXCLUDED.r_value_free_dcc,
                    r_value_work_depositor = EXCLUDED.r_value_work_depositor,
                    r_value_work_dcc = EXCLUDED.r_value_work_dcc,
                    r_value_observed = EXCLUDED.r_value_observed,
                    space_group = EXCLUDED.space_group,
                    unit_cell_a = EXCLUDED.unit_cell_a,
                    unit_cell_b = EXCLUDED.unit_cell_b,
                    unit_cell_c = EXCLUDED.unit_cell_c,
                    unit_cell_alpha = EXCLUDED.unit_cell_alpha,
                    unit_cell_beta = EXCLUDED.unit_cell_beta,
                    unit_cell_gamma = EXCLUDED.unit_cell_gamma`,
                [pdb_id, method, resolution_A, r_value_free_depositor, r_value_free_dcc,
                 r_value_work_depositor, r_value_work_dcc, r_value_observed, space_group,
                 unit_cell_a, unit_cell_b, unit_cell_c, unit_cell_alpha, unit_cell_beta, unit_cell_gamma]
            );
            console.log(`  Experimental_Data for ${pdb_id} processed.`);

            // --- 4. Extract and Insert into 'Macromolecule' table ---
            await client.query('DELETE FROM Macromolecule WHERE pdb_id = $1', [pdb_id]);

            let entityLoopData = parseCifLoop(fullCifData, 'loop_ _entity.');
            let polyLoopData = parseCifLoop(fullCifData, 'loop_ _entity_poly.');
            
            // Combine entity and poly data
            const macromoleculeData = [];
            
            if (entityLoopData.length === 0) {
                // Fallback: try to extract single-value tags
                const entity_id = getCifValue(fullCifData, '_entity.id');
                const type = getCifValue(fullCifData, '_entity.type');
                const pdbx_description = getCifValue(fullCifData, '_entity.pdbx_description');
                
                if (entity_id && type === 'polymer') {
                    entityLoopData = [{
                        '_entity.id': entity_id,
                        '_entity.type': type,
                        '_entity.pdbx_description': pdbx_description
                    }];
                }
            }

            for (const entity of entityLoopData) {
                if (entity['_entity.type'] === 'polymer') {
                    const entity_id = parseInt(entity['_entity.id']);
                    const molecule_name = entity['_entity.pdbx_description'] || 'Unknown protein';
                    
                    // Find corresponding poly data
                    const polyData = polyLoopData.find(poly => parseInt(poly['_entity_poly.entity_id']) === entity_id) || {};
                    
                    const chain_ids = polyData['_entity_poly.pdbx_strand_id'] || null;
                    const sequence_length_str = polyData['_entity_poly.pdbx_sequence_length'];
                    const sequence_length = sequence_length_str ? parseInt(sequence_length_str) : null;
                    
                    // Get organism from entity_src_nat or entity_src_gen
                    const organism = (getCifValue(fullCifData, '_entity_src_nat.pdbx_organism_scientific') || 
                                   getCifValue(fullCifData, '_entity_src_gen.pdbx_organism_scientific') || '').substring(0, 255);
                    
                    const mutations = (getCifValue(fullCifData, '_entity_src_gen.pdbx_gene_src_variant') || '').substring(0, 255);
                    const ec_number = (getCifValue(fullCifData, '_entity.pdbx_ec') || '').substring(0, 20);
                    const uniprot_id = (getCifValue(fullCifData, '_struct_ref.pdbx_db_accession') || '').substring(0, 20);

                    macromoleculeData.push({
                        entity_id,
                        molecule_name,
                        chain_ids,
                        sequence_length,
                        organism,
                        mutations,
                        ec_number,
                        uniprot_id
                    });
                }
            }

            for (const macro of macromoleculeData) {
                await client.query(
                    `INSERT INTO Macromolecule (pdb_id, entity_id, molecule_name, chain_ids, sequence_length, 
                                              organism, mutations, ec_number, uniprot_id)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                    [pdb_id, macro.entity_id, macro.molecule_name, macro.chain_ids, macro.sequence_length,
                     macro.organism, macro.mutations, macro.ec_number, macro.uniprot_id]
                );
            }
            console.log(`  Macromolecule data for ${pdb_id} processed.`);

            // --- 5. Extract and Insert into 'Ligands' table ---
            await client.query('DELETE FROM Ligands WHERE pdb_id = $1', [pdb_id]);

            let chemCompLoopData = parseCifLoop(fullCifData, 'loop_ _chem_comp.');
            if (chemCompLoopData.length === 0) {
                // Fallback: try to extract single-value tags
                const comp_id = getCifValue(fullCifData, '_chem_comp.id');
                if (comp_id && comp_id !== '_chem_comp.type') {
                    chemCompLoopData = [{
                        '_chem_comp.id': comp_id,
                        '_chem_comp.name': getCifValue(fullCifData, '_chem_comp.name'),
                        '_chem_comp.formula': getCifValue(fullCifData, '_chem_comp.formula'),
                        '_chem_comp.pdbx_synonyms': getCifValue(fullCifData, '_chem_comp.pdbx_synonyms')
                    }];
                }
            }

            for (const ligand of chemCompLoopData) {
                const ligand_id = (ligand['_chem_comp.id'] || '').substring(0, 10);
                const ligand_name = (ligand['_chem_comp.name'] || ligand_id || '').substring(0, 255);
                const chemical_formula = (ligand['_chem_comp.formula'] || '').substring(0, 100);
                const inchi_key = (getCifValue(fullCifData, '_pdbx_chem_comp_descriptor.descriptor') || '').substring(0, 100);
                
                // Try to find which chains the ligand is bound to
                const bound_chains = (getCifValue(fullCifData, '_struct_site.pdbx_auth_asym_id') || '').substring(0, 50);

                await client.query(
                    `INSERT INTO Ligands (pdb_id, ligand_id, ligand_name, chemical_formula, inchi_key, bound_chains)
                     VALUES ($1, $2, $3, $4, $5, $6)`,
                    [pdb_id, ligand_id, ligand_name, chemical_formula, inchi_key, bound_chains]
                );
            }
            console.log(`  Ligands for ${pdb_id} processed.`);

            // --- 6. Extract and Insert into 'Software_Used' table ---
            await client.query('DELETE FROM Software_Used WHERE pdb_id = $1', [pdb_id]);

            let softwareLoopData = parseCifLoop(fullCifData, 'loop_');
            // Filter to only include software-related records
            softwareLoopData = softwareLoopData.filter(record => 
                record['_software.name'] && record['_software.classification']
            );
            
            if (softwareLoopData.length === 0) {
                // Fallback: try to extract single-value tags
                const software_name = getCifValue(fullCifData, '_software.name');
                const software_classification = getCifValue(fullCifData, '_software.classification');
                
                if (software_name) {
                    softwareLoopData = [{
                        '_software.name': software_name,
                        '_software.classification': software_classification
                    }];
                }
            }

            for (const software of softwareLoopData) {
                const software_name = software['_software.name'];
                const software_purpose = software['_software.classification'] || 
                                       software['_software.purpose'] || 
                                       'Unknown purpose';

                if (software_name) {
                    await client.query(
                        `INSERT INTO Software_Used (pdb_id, software_name, software_purpose)
                         VALUES ($1, $2, $3)`,
                        [pdb_id, software_name, software_purpose]
                    );
                }
            }
            console.log(`  Software_Used for ${pdb_id} processed.`);

            // --- 7. Extract and Insert into 'Version_History' table ---
            await client.query('DELETE FROM Version_History WHERE pdb_id = $1', [pdb_id]);

            let revisionLoopData = parseCifLoop(fullCifData, 'loop_ _database_PDB_rev.');
            if (revisionLoopData.length === 0) {
                // Fallback: try to extract single-value tags
                const revision_num = getCifValue(fullCifData, '_database_PDB_rev.num');
                const revision_date = getCifValue(fullCifData, '_database_PDB_rev.date');
                const revision_details = getCifValue(fullCifData, '_database_PDB_rev.details');
                
                if (revision_num && revision_date) {
                    revisionLoopData = [{
                        '_database_PDB_rev.num': revision_num,
                        '_database_PDB_rev.date': revision_date,
                        '_database_PDB_rev.details': revision_details
                    }];
                }
            }

            for (const revision of revisionLoopData) {
                const version = revision['_database_PDB_rev.num'];
                const release_date_str = revision['_database_PDB_rev.date'];
                const release_date = release_date_str && release_date_str !== '?' ? new Date(release_date_str) : null;
                // Validate the date
                const valid_release_date = release_date && !isNaN(release_date.getTime()) ? release_date : null;
                const changes = revision['_database_PDB_rev.details'] || 'No details available';

                if (version && valid_release_date) {
                    await client.query(
                        `INSERT INTO Version_History (pdb_id, version, release_date, changes)
                         VALUES ($1, $2, $3, $4)`,
                        [pdb_id, version, valid_release_date, changes]
                    );
                }
            }
            console.log(`  Version_History for ${pdb_id} processed.`);
        }

        await client.query('COMMIT');
        console.log('All protein data loaded successfully!');

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error during data loading:', err);
    } finally {
        client.release();
        console.log('Data loading process finished.');
    }
}

loadProteins();