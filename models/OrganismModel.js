// backend/models/OrganismModel.js
const BaseModel = require('./BaseModel');

class OrganismModel extends BaseModel {
    constructor() {
        super('organisms', 'organism_id');
    }

    // Search organisms with taxonomic information
    async searchWithTaxonomy(searchArg, pagination = {}, sort = {}) {
        try {
            const { page = 1, limit = 10 } = pagination;
            const { field = 'scientific_name', direction = 'ASC' } = sort;
            const offset = (page - 1) * limit;

            let query = `
                SELECT 
                    o.*,
                    COUNT(DISTINCT eo.pdb_id) as structure_count,
                    array_agg(DISTINCT eo.pdb_id) as structures
                FROM organisms o
                LEFT JOIN entry_organisms eo ON o.organism_id = eo.organism_id
            `;

            let whereClause = '';
            const params = [];

            if (searchArg) {
                const conditions = [];
                
                if (searchArg.scientific_name) {
                    conditions.push(`o.scientific_name ILIKE $${params.length + 1}`);
                    params.push(`%${searchArg.scientific_name}%`);
                }

                if (searchArg.common_name) {
                    conditions.push(`o.common_name ILIKE $${params.length + 1}`);
                    params.push(`%${searchArg.common_name}%`);
                }

                if (searchArg.kingdom) {
                    conditions.push(`o.kingdom = $${params.length + 1}`);
                    params.push(searchArg.kingdom);
                }

                if (searchArg.phylum) {
                    conditions.push(`o.phylum = $${params.length + 1}`);
                    params.push(searchArg.phylum);
                }

                if (searchArg.class) {
                    conditions.push(`o.class = $${params.length + 1}`);
                    params.push(searchArg.class);
                }

                if (searchArg.taxonomy_id) {
                    conditions.push(`o.taxonomy_id = $${params.length + 1}`);
                    params.push(searchArg.taxonomy_id);
                }

                if (conditions.length > 0) {
                    whereClause = `WHERE ${conditions.join(' AND ')}`;
                }
            }

            // Count query
            const countQuery = `
                SELECT COUNT(DISTINCT o.organism_id) FROM organisms o
                ${whereClause}
            `;
            const countResult = await pool.query(countQuery, params);
            const total = parseInt(countResult.rows[0].count);

            // Data query
            const dataQuery = `
                ${query}
                ${whereClause}
                GROUP BY o.organism_id
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
            throw new Error(`Error searching organisms: ${error.message}`);
        }
    }

    // Get organism with all related structures
    async getOrganismWithStructures(organism_id) {
        try {
            const organism = await this.readOne(organism_id);
            if (!organism) return null;

            const query = `
                SELECT 
                    e.pdb_id,
                    e.title,
                    e.deposition_date,
                    e.experimental_method,
                    e.resolution,
                    eo.source_type,
                    eo.entity_id
                FROM entries e
                JOIN entry_organisms eo ON e.pdb_id = eo.pdb_id
                WHERE eo.organism_id = $1
                ORDER BY e.deposition_date DESC
            `;
            const result = await pool.query(query, [organism_id]);
            
            return {
                ...organism,
                structures: result.rows
            };
        } catch (error) {
            throw new Error(`Error getting organism with structures: ${error.message}`);
        }
    }

    // Get taxonomic tree for an organism
    async getTaxonomicTree(organism_id) {
        try {
            const organism = await this.readOne(organism_id);
            if (!organism) return null;

            return {
                organism_id: organism.organism_id,
                scientific_name: organism.scientific_name,
                taxonomy: {
                    kingdom: organism.kingdom,
                    phylum: organism.phylum,
                    class: organism.class,
                    order: organism.order_name,
                    family: organism.family,
                    genus: organism.genus,
                    species: organism.species
                }
            };
        } catch (error) {
            throw new Error(`Error getting taxonomic tree: ${error.message}`);
        }
    }

    // Get organism statistics
    async getOrganismStatistics() {
        try {
            const queries = {
                kingdomDistribution: `
                    SELECT 
                        COALESCE(kingdom, 'Unknown') as kingdom,
                        COUNT(*) as count
                    FROM organisms
                    GROUP BY kingdom
                    ORDER BY count DESC
                `,
                topOrganisms: `
                    SELECT 
                        o.scientific_name,
                        o.common_name,
                        COUNT(DISTINCT eo.pdb_id) as structure_count
                    FROM organisms o
                    LEFT JOIN entry_organisms eo ON o.organism_id = eo.organism_id
                    GROUP BY o.organism_id, o.scientific_name, o.common_name
                    ORDER BY structure_count DESC
                    LIMIT 20
                `,
                phylumDistribution: `
                    SELECT 
                        COALESCE(phylum, 'Unknown') as phylum,
                        COUNT(*) as count
                    FROM organisms
                    WHERE phylum IS NOT NULL
                    GROUP BY phylum
                    ORDER BY count DESC
                    LIMIT 10
                `,
                sourceTypeDistribution: `
                    SELECT 
                        source_type,
                        COUNT(*) as count
                    FROM entry_organisms
                    GROUP BY source_type
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
            throw new Error(`Error getting organism statistics: ${error.message}`);
        }
    }

    // Find related organisms by taxonomic similarity
    async findRelatedOrganisms(organism_id, taxonomic_level = 'genus') {
        try {
            const organism = await this.readOne(organism_id);
            if (!organism) return [];

            const levelMap = {
                'kingdom': 'kingdom',
                'phylum': 'phylum',
                'class': 'class',
                'order': 'order_name',
                'family': 'family',
                'genus': 'genus'
            };

            const field = levelMap[taxonomic_level];
            if (!field || !organism[field]) return [];

            const query = `
                SELECT 
                    o.*,
                    COUNT(DISTINCT eo.pdb_id) as structure_count
                FROM organisms o
                LEFT JOIN entry_organisms eo ON o.organism_id = eo.organism_id
                WHERE o.${field} = $1 AND o.organism_id != $2
                GROUP BY o.organism_id
                ORDER BY structure_count DESC, o.scientific_name
            `;
            const result = await pool.query(query, [organism[field], organism_id]);
            return result.rows;
        } catch (error) {
            throw new Error(`Error finding related organisms: ${error.message}`);
        }
    }

    // Add or update organism relationships
    async addOrganismToEntry(pdb_id, organism_data) {
        try {
            const { organism_id, entity_id, source_type, expression_system_id } = organism_data;
            
            const query = `
                INSERT INTO entry_organisms (pdb_id, organism_id, entity_id, source_type, expression_system_id)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (pdb_id, organism_id, entity_id) DO UPDATE SET
                    source_type = EXCLUDED.source_type,
                    expression_system_id = EXCLUDED.expression_system_id
                RETURNING *
            `;
            const result = await pool.query(query, [pdb_id, organism_id, entity_id, source_type, expression_system_id]);
            return result.rows[0];
        } catch (error) {
            throw new Error(`Error adding organism to entry: ${error.message}`);
        }
    }

    // Remove organism from entry
    async removeOrganismFromEntry(pdb_id, organism_id, entity_id) {
        try {
            const query = `
                DELETE FROM entry_organisms
                WHERE pdb_id = $1 AND organism_id = $2 AND entity_id = $3
                RETURNING *
            `;
            const result = await pool.query(query, [pdb_id, organism_id, entity_id]);
            return result.rows[0];
        } catch (error) {
            throw new Error(`Error removing organism from entry: ${error.message}`);
        }
    }

    // Get organism expression systems
    async getExpressionSystems() {
        try {
            const query = `
                SELECT 
                    o.organism_id,
                    o.scientific_name,
                    o.common_name,
                    COUNT(DISTINCT eo.pdb_id) as used_count
                FROM organisms o
                JOIN entry_organisms eo ON o.organism_id = eo.expression_system_id
                GROUP BY o.organism_id, o.scientific_name, o.common_name
                ORDER BY used_count DESC
            `;
            const result = await pool.query(query);
            return result.rows;
        } catch (error) {
            throw new Error(`Error getting expression systems: ${error.message}`);
        }
    }

    // Update taxonomic information
    async updateTaxonomy(organism_id, taxonomy_data) {
        try {
            const { kingdom, phylum, class: className, order_name, family, genus, species } = taxonomy_data;
            
            const query = `
                UPDATE organisms 
                SET kingdom = $2, phylum = $3, class = $4, order_name = $5, 
                    family = $6, genus = $7, species = $8, updated_at = CURRENT_TIMESTAMP
                WHERE organism_id = $1
                RETURNING *
            `;
            const result = await pool.query(query, [organism_id, kingdom, phylum, className, order_name, family, genus, species]);
            return result.rows[0];
        } catch (error) {
            throw new Error(`Error updating taxonomy: ${error.message}`);
        }
    }
}

module.exports = OrganismModel;
