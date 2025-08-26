// backend/models/LigandModel.js
const BaseModel = require('./BaseModel');

class LigandModel extends BaseModel {
    constructor() {
        super('ligands', 'ligand_id');
    }

    // Get ligands for a specific entry
    async getLigandsByEntry(pdb_id) {
        try {
            const query = `
                SELECT l.*, e.title as entry_title
                FROM ligands l
                LEFT JOIN entries e ON l.pdb_id = e.pdb_id
                WHERE l.pdb_id = $1
                ORDER BY l.weight DESC, l.comp_id
            `;
            const result = await pool.query(query, [pdb_id]);
            return result.rows;
        } catch (error) {
            throw new Error(`Error getting ligands for entry ${pdb_id}: ${error.message}`);
        }
    }

    // Search ligands with chemical properties
    async searchWithChemicalProperties(searchArg, pagination = {}, sort = {}) {
        try {
            const { page = 1, limit = 10 } = pagination;
            const { field = 'weight', direction = 'DESC' } = sort;
            const offset = (page - 1) * limit;

            let query = `
                SELECT 
                    l.*,
                    e.title as entry_title,
                    e.pdb_id as entry_pdb_id,
                    COUNT(l2.comp_id) as occurrence_count
                FROM ligands l
                LEFT JOIN entries e ON l.pdb_id = e.pdb_id
                LEFT JOIN ligands l2 ON l.comp_id = l2.comp_id
            `;

            let whereClause = '';
            const params = [];

            if (searchArg) {
                const conditions = [];
                
                if (searchArg.name) {
                    conditions.push(`l.name ILIKE $${params.length + 1}`);
                    params.push(`%${searchArg.name}%`);
                }

                if (searchArg.formula) {
                    conditions.push(`l.formula ILIKE $${params.length + 1}`);
                    params.push(`%${searchArg.formula}%`);
                }

                if (searchArg.minWeight) {
                    conditions.push(`l.weight >= $${params.length + 1}`);
                    params.push(searchArg.minWeight);
                }

                if (searchArg.maxWeight) {
                    conditions.push(`l.weight <= $${params.length + 1}`);
                    params.push(searchArg.maxWeight);
                }

                if (searchArg.comp_id) {
                    conditions.push(`l.comp_id = $${params.length + 1}`);
                    params.push(searchArg.comp_id);
                }

                if (conditions.length > 0) {
                    whereClause = `WHERE ${conditions.join(' AND ')}`;
                }
            }

            // Count query
            const countQuery = `
                SELECT COUNT(DISTINCT l.ligand_id) FROM ligands l
                LEFT JOIN entries e ON l.pdb_id = e.pdb_id
                ${whereClause}
            `;
            const countResult = await pool.query(countQuery, params);
            const total = parseInt(countResult.rows[0].count);

            // Data query
            const dataQuery = `
                ${query}
                ${whereClause}
                GROUP BY l.ligand_id, e.title, e.pdb_id
                ORDER BY ${field} ${direction}
                LIMIT $${params.length + 1} OFFSET $${params.length + 2}
            `;
            const dataResult = await pool.query(dataQuery, [...params, limit, offset]);

            return {
                data: dataResult.rows,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            };
        } catch (error) {
            throw new Error(`Error searching ligands: ${error.message}`);
        }
    }

    // Get unique ligands with occurrence count
    async getUniqueLigands() {
        try {
            const query = `
                SELECT 
                    l.comp_id,
                    l.name,
                    l.formula,
                    AVG(l.weight) as avg_weight,
                    COUNT(*) as occurrence_count,
                    array_agg(DISTINCT l.pdb_id) as found_in_structures
                FROM ligands l
                GROUP BY l.comp_id, l.name, l.formula
                ORDER BY occurrence_count DESC, l.comp_id
            `;
            const result = await pool.query(query);
            return result.rows;
        } catch (error) {
            throw new Error(`Error getting unique ligands: ${error.message}`);
        }
    }

    // Get ligand statistics
    async getLigandStatistics() {
        try {
            const queries = {
                weightDistribution: `
                    SELECT 
                        CASE 
                            WHEN weight < 100 THEN '< 100 Da'
                            WHEN weight < 200 THEN '100-200 Da'
                            WHEN weight < 300 THEN '200-300 Da'
                            WHEN weight < 500 THEN '300-500 Da'
                            WHEN weight < 1000 THEN '500-1000 Da'
                            ELSE '> 1000 Da'
                        END as weight_range,
                        COUNT(*) as count
                    FROM ligands
                    WHERE weight IS NOT NULL
                    GROUP BY weight_range
                    ORDER BY weight_range
                `,
                mostCommonLigands: `
                    SELECT 
                        comp_id,
                        name,
                        COUNT(*) as occurrence_count,
                        AVG(weight) as avg_weight
                    FROM ligands
                    GROUP BY comp_id, name
                    ORDER BY occurrence_count DESC
                    LIMIT 20
                `,
                elementalComposition: `
                    SELECT 
                        CASE 
                            WHEN formula ~ 'C[0-9]*' THEN 'Carbon-containing'
                            WHEN formula ~ 'N[0-9]*' THEN 'Nitrogen-containing'
                            WHEN formula ~ 'O[0-9]*' THEN 'Oxygen-containing'
                            WHEN formula ~ 'S[0-9]*' THEN 'Sulfur-containing'
                            ELSE 'Other'
                        END as element_type,
                        COUNT(*) as count
                    FROM ligands
                    WHERE formula IS NOT NULL
                    GROUP BY element_type
                    ORDER BY count DESC
                `
            };

            const results = {};
            for (const [key, query] of Object.entries(queries)) {
                const result = await pool.query(query);
                results[key] = result.rows;
            }

            return results;
        } catch (error) {
            throw new Error(`Error getting ligand statistics: ${error.message}`);
        }
    }

    // Find ligand co-occurrences
    async findLigandCooccurrences(comp_id, limit = 10) {
        try {
            const query = `
                SELECT 
                    l2.comp_id,
                    l2.name,
                    COUNT(*) as cooccurrence_count,
                    array_agg(DISTINCT l2.pdb_id) as cooccurring_structures
                FROM ligands l1
                JOIN ligands l2 ON l1.pdb_id = l2.pdb_id
                WHERE l1.comp_id = $1 AND l2.comp_id != $1
                GROUP BY l2.comp_id, l2.name
                ORDER BY cooccurrence_count DESC
                LIMIT $2
            `;
            const result = await pool.query(query, [comp_id, limit]);
            return result.rows;
        } catch (error) {
            throw new Error(`Error finding ligand co-occurrences: ${error.message}`);
        }
    }

    // Update ligand binding information
    async updateBindingInfo(ligand_id, binding_data) {
        try {
            const { binding_affinity, binding_site } = binding_data;
            const query = `
                UPDATE ligands 
                SET binding_affinity = $2, binding_site = $3, updated_at = CURRENT_TIMESTAMP
                WHERE ligand_id = $1
                RETURNING *
            `;
            const result = await pool.query(query, [ligand_id, binding_affinity, binding_site]);
            return result.rows[0];
        } catch (error) {
            throw new Error(`Error updating ligand binding info: ${error.message}`);
        }
    }

    // Get ligand-entry relationships
    async getLigandEntryRelationships(ligand_id) {
        try {
            const query = `
                SELECT 
                    l.*,
                    e.title,
                    e.experimental_method,
                    e.resolution,
                    e.deposition_date,
                    c.chain_count,
                    o.organism_count
                FROM ligands l
                LEFT JOIN entries e ON l.pdb_id = e.pdb_id
                LEFT JOIN (
                    SELECT pdb_id, COUNT(*) as chain_count
                    FROM chains
                    GROUP BY pdb_id
                ) c ON l.pdb_id = c.pdb_id
                LEFT JOIN (
                    SELECT pdb_id, COUNT(*) as organism_count
                    FROM entry_organisms
                    GROUP BY pdb_id
                ) o ON l.pdb_id = o.pdb_id
                WHERE l.ligand_id = $1
            `;
            const result = await pool.query(query, [ligand_id]);
            return result.rows[0];
        } catch (error) {
            throw new Error(`Error getting ligand-entry relationships: ${error.message}`);
        }
    }
}

module.exports = LigandModel;
