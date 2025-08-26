// backend/models/ChainModel.js
const BaseModel = require('./BaseModel');

class ChainModel extends BaseModel {
    constructor() {
        super('chains', 'chain_id');
    }

    // Get chains for a specific entry
    async getChainsByEntry(pdb_id) {
        try {
            const query = `
                SELECT c.*, o.scientific_name as organism_name
                FROM chains c
                LEFT JOIN entry_organisms eo ON c.pdb_id = eo.pdb_id AND c.entity_id = eo.entity_id
                LEFT JOIN organisms o ON eo.organism_id = o.organism_id
                WHERE c.pdb_id = $1
                ORDER BY c.auth_asym_id, c.entity_id
            `;
            const result = await pool.query(query, [pdb_id]);
            return result.rows;
        } catch (error) {
            throw new Error(`Error getting chains for entry ${pdb_id}: ${error.message}`);
        }
    }

    // Search chains with sequence analysis
    async searchWithSequenceAnalysis(searchArg, pagination = {}, sort = {}) {
        try {
            const { page = 1, limit = 10 } = pagination;
            const { field = 'sequence_length', direction = 'DESC' } = sort;
            const offset = (page - 1) * limit;

            // Build base query with sequence analysis
            let query = `
                SELECT 
                    c.*,
                    e.title as entry_title,
                    o.scientific_name as organism_name,
                    LENGTH(c.sequence) as calculated_length,
                    (LENGTH(c.sequence) - LENGTH(REPLACE(c.sequence, 'A', ''))) as alanine_count,
                    (LENGTH(c.sequence) - LENGTH(REPLACE(c.sequence, 'G', ''))) as glycine_count,
                    (LENGTH(c.sequence) - LENGTH(REPLACE(c.sequence, 'C', ''))) as cysteine_count
                FROM chains c
                LEFT JOIN entries e ON c.pdb_id = e.pdb_id
                LEFT JOIN entry_organisms eo ON c.pdb_id = eo.pdb_id AND c.entity_id = eo.entity_id
                LEFT JOIN organisms o ON eo.organism_id = o.organism_id
            `;

            let whereClause = '';
            const params = [];

            // Handle sequence-specific searches
            if (searchArg) {
                const conditions = [];
                
                if (searchArg.sequenceContains) {
                    conditions.push(`c.sequence LIKE $${params.length + 1}`);
                    params.push(`%${searchArg.sequenceContains}%`);
                }

                if (searchArg.minLength) {
                    conditions.push(`c.sequence_length >= $${params.length + 1}`);
                    params.push(searchArg.minLength);
                }

                if (searchArg.maxLength) {
                    conditions.push(`c.sequence_length <= $${params.length + 1}`);
                    params.push(searchArg.maxLength);
                }

                if (searchArg.chainType) {
                    conditions.push(`c.chain_type = $${params.length + 1}`);
                    params.push(searchArg.chainType);
                }

                if (searchArg.organism) {
                    conditions.push(`o.scientific_name ILIKE $${params.length + 1}`);
                    params.push(`%${searchArg.organism}%`);
                }

                if (conditions.length > 0) {
                    whereClause = `WHERE ${conditions.join(' AND ')}`;
                }
            }

            // Count query
            const countQuery = `
                SELECT COUNT(*) FROM chains c
                LEFT JOIN entry_organisms eo ON c.pdb_id = eo.pdb_id AND c.entity_id = eo.entity_id
                LEFT JOIN organisms o ON eo.organism_id = o.organism_id
                ${whereClause}
            `;
            const countResult = await pool.query(countQuery, params);
            const total = parseInt(countResult.rows[0].count);

            // Data query
            const dataQuery = `
                ${query}
                ${whereClause}
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
            throw new Error(`Error searching chains: ${error.message}`);
        }
    }

    // Get amino acid composition for a chain
    async getAminoAcidComposition(chain_id) {
        try {
            const chain = await this.readOne(chain_id);
            if (!chain || !chain.sequence) return null;

            const aminoAcids = ['A', 'R', 'N', 'D', 'C', 'Q', 'E', 'G', 'H', 'I', 'L', 'K', 'M', 'F', 'P', 'S', 'T', 'W', 'Y', 'V'];
            const composition = {};

            for (const aa of aminoAcids) {
                const count = (chain.sequence.match(new RegExp(aa, 'g')) || []).length;
                composition[aa] = {
                    count,
                    percentage: (count / chain.sequence.length * 100).toFixed(2)
                };
            }

            return {
                chain_id: chain.chain_id,
                pdb_id: chain.pdb_id,
                sequence_length: chain.sequence_length,
                composition
            };
        } catch (error) {
            throw new Error(`Error getting amino acid composition: ${error.message}`);
        }
    }

    // Get chain statistics
    async getChainStatistics() {
        try {
            const queries = {
                lengthDistribution: `
                    SELECT 
                        CASE 
                            WHEN sequence_length < 50 THEN '< 50'
                            WHEN sequence_length < 100 THEN '50-100'
                            WHEN sequence_length < 200 THEN '100-200'
                            WHEN sequence_length < 300 THEN '200-300'
                            WHEN sequence_length < 500 THEN '300-500'
                            ELSE '> 500'
                        END as length_range,
                        COUNT(*) as count
                    FROM chains
                    WHERE sequence_length IS NOT NULL
                    GROUP BY length_range
                    ORDER BY length_range
                `,
                typeDistribution: `
                    SELECT chain_type, COUNT(*) as count
                    FROM chains
                    WHERE chain_type IS NOT NULL
                    GROUP BY chain_type
                    ORDER BY count DESC
                `,
                organismDistribution: `
                    SELECT o.scientific_name, COUNT(DISTINCT c.chain_id) as chain_count
                    FROM chains c
                    LEFT JOIN entry_organisms eo ON c.pdb_id = eo.pdb_id AND c.entity_id = eo.entity_id
                    LEFT JOIN organisms o ON eo.organism_id = o.organism_id
                    WHERE o.scientific_name IS NOT NULL
                    GROUP BY o.scientific_name
                    ORDER BY chain_count DESC
                    LIMIT 10
                `
            };

            const results = {};
            for (const [key, query] of Object.entries(queries)) {
                const result = await pool.query(query);
                results[key] = result.rows;
            }

            return results;
        } catch (error) {
            throw new Error(`Error getting chain statistics: ${error.message}`);
        }
    }

    // Find similar chains by sequence similarity (basic implementation)
    async findSimilarChains(chain_id, similarity_threshold = 0.7) {
        try {
            const targetChain = await this.readOne(chain_id);
            if (!targetChain || !targetChain.sequence) return [];

            // Simple similarity search - in production, use a proper sequence alignment tool
            const query = `
                SELECT 
                    c.*,
                    e.title as entry_title,
                    (1.0 - (LENGTH(c.sequence) - LENGTH($2)) / GREATEST(LENGTH(c.sequence), LENGTH($2))) as rough_similarity
                FROM chains c
                LEFT JOIN entries e ON c.pdb_id = e.pdb_id
                WHERE c.chain_id != $1
                AND c.sequence IS NOT NULL
                AND c.chain_type = $3
                AND ABS(LENGTH(c.sequence) - LENGTH($2)) < LENGTH($2) * 0.3
                ORDER BY rough_similarity DESC
                LIMIT 20
            `;

            const result = await pool.query(query, [chain_id, targetChain.sequence, targetChain.chain_type]);
            return result.rows;
        } catch (error) {
            throw new Error(`Error finding similar chains: ${error.message}`);
        }
    }

    // Update chain relationships
    async updateChainOrganism(chain_id, organism_id) {
        try {
            const chain = await this.readOne(chain_id);
            if (!chain) throw new Error('Chain not found');

            const query = `
                UPDATE entry_organisms 
                SET organism_id = $3
                WHERE pdb_id = $1 AND entity_id = $2
                RETURNING *
            `;
            const result = await pool.query(query, [chain.pdb_id, chain.entity_id, organism_id]);
            return result.rows[0];
        } catch (error) {
            throw new Error(`Error updating chain organism: ${error.message}`);
        }
    }
}

module.exports = ChainModel;
