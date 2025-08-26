// backend/models/EntryModel.js
const BaseModel = require('./BaseModel');
const pool = require('../db');

class EntryModel extends BaseModel {
    constructor() {
        super('entries', 'pdb_id');
    }

    // Override search to include full-text search capabilities
    async search(searchArg, pagination = {}, sort = {}) {
        try {
            const { page = 1, limit = 10 } = pagination;
            const { field = 'deposition_date', direction = 'DESC' } = sort;
            const offset = (page - 1) * limit;

            // Enhanced search with text search capabilities
            if (searchArg && searchArg.text) {
                const textSearch = searchArg.text;
                delete searchArg.text;

                const whereClause = this.buildWhereClause(searchArg);
                const textCondition = whereClause.sql ? 
                    `${whereClause.sql} AND (title ILIKE $${whereClause.params.length + 1} OR pdb_id ILIKE $${whereClause.params.length + 1} OR keywords ILIKE $${whereClause.params.length + 1})` :
                    `WHERE (title ILIKE $1 OR pdb_id ILIKE $1 OR keywords ILIKE $1)`;

                const searchParams = [...whereClause.params, `%${textSearch}%`];

                // Count query
                const countQuery = `SELECT COUNT(*) FROM ${this.tableName} ${textCondition}`;
                const countResult = await pool.query(countQuery, searchParams);
                const total = parseInt(countResult.rows[0].count);

                // Data query
                const dataQuery = `
                    SELECT e.*, sd.molecular_weight, sd.protein_length, sd.biological_assembly_count
                    FROM ${this.tableName} e
                    LEFT JOIN structure_details sd ON e.pdb_id = sd.pdb_id
                    ${textCondition}
                    ORDER BY ${field} ${direction}
                    LIMIT $${searchParams.length + 1} OFFSET $${searchParams.length + 2}
                `;
                const dataResult = await pool.query(dataQuery, [...searchParams, limit, offset]);

                return {
                    data: dataResult.rows,
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total,
                        totalPages: Math.ceil(total / limit)
                    }
                };
            }

            return super.search(searchArg, pagination, sort);
        } catch (error) {
            throw new Error(`Error searching entries: ${error.message}`);
        }
    }

    // Get entry with all relationships
    async readOneWithRelationships(pdb_id) {
        try {
            const entry = await this.readOne(pdb_id);
            if (!entry) return null;

            const relationships = [
                {
                    type: 'hasMany',
                    table: 'chains',
                    foreignKey: 'pdb_id',
                    localKey: 'pdb_id',
                    as: 'chains'
                },
                {
                    type: 'hasMany',
                    table: 'ligands',
                    foreignKey: 'pdb_id',
                    localKey: 'pdb_id',
                    as: 'ligands'
                },
                {
                    type: 'manyToMany',
                    table: 'organisms',
                    junction: 'entry_organisms',
                    sourceKey: 'pdb_id',
                    targetKey: 'organism_id',
                    localKey: 'pdb_id',
                    as: 'organisms'
                },
                {
                    type: 'manyToMany',
                    table: 'citations',
                    junction: 'entry_citations',
                    sourceKey: 'pdb_id',
                    targetKey: 'citation_id',
                    localKey: 'pdb_id',
                    as: 'citations'
                }
            ];

            return await this.resolveRelationships(entry, relationships);
        } catch (error) {
            throw new Error(`Error reading entry with relationships: ${error.message}`);
        }
    }

    // Get entries with summary statistics
    async getEntriesSummary(filters = {}) {
        try {
            const query = `
                SELECT 
                    e.pdb_id,
                    e.title,
                    e.deposition_date,
                    e.experimental_method,
                    e.resolution,
                    e.classification,
                    sd.molecular_weight,
                    sd.protein_length,
                    COUNT(DISTINCT c.chain_id) as chain_count,
                    COUNT(DISTINCT l.ligand_id) as ligand_count,
                    COUNT(DISTINCT eo.organism_id) as organism_count,
                    COUNT(DISTINCT ec.citation_id) as citation_count
                FROM entries e
                LEFT JOIN structure_details sd ON e.pdb_id = sd.pdb_id
                LEFT JOIN chains c ON e.pdb_id = c.pdb_id
                LEFT JOIN ligands l ON e.pdb_id = l.pdb_id
                LEFT JOIN entry_organisms eo ON e.pdb_id = eo.pdb_id
                LEFT JOIN entry_citations ec ON e.pdb_id = ec.pdb_id
                GROUP BY e.pdb_id, e.title, e.deposition_date, e.experimental_method, e.resolution, e.classification, sd.molecular_weight, sd.protein_length
                ORDER BY e.deposition_date DESC
            `;

            const result = await pool.query(query);
            return result.rows;
        } catch (error) {
            throw new Error(`Error getting entries summary: ${error.message}`);
        }
    }

    // Get statistics for plotting
    async getStatistics() {
        try {
            const queries = {
                resolutionDistribution: `
                    SELECT 
                        CASE 
                            WHEN resolution < 1.0 THEN '< 1.0 Å'
                            WHEN resolution < 1.5 THEN '1.0-1.5 Å'
                            WHEN resolution < 2.0 THEN '1.5-2.0 Å'
                            WHEN resolution < 2.5 THEN '2.0-2.5 Å'
                            WHEN resolution < 3.0 THEN '2.5-3.0 Å'
                            ELSE '> 3.0 Å'
                        END as resolution_range,
                        COUNT(*) as count
                    FROM entries 
                    WHERE resolution IS NOT NULL
                    GROUP BY resolution_range
                    ORDER BY resolution_range
                `,
                methodDistribution: `
                    SELECT experimental_method, COUNT(*) as count
                    FROM entries
                    GROUP BY experimental_method
                    ORDER BY count DESC
                `,
                yearDistribution: `
                    SELECT EXTRACT(YEAR FROM deposition_date) as year, COUNT(*) as count
                    FROM entries
                    WHERE deposition_date IS NOT NULL
                    GROUP BY year
                    ORDER BY year
                `,
                proteinLengthDistribution: `
                    SELECT 
                        CASE 
                            WHEN LENGTH(title) < 20 THEN '< 20 chars'
                            WHEN LENGTH(title) < 40 THEN '20-40 chars'
                            WHEN LENGTH(title) < 60 THEN '40-60 chars'
                            WHEN LENGTH(title) < 80 THEN '60-80 chars'
                            ELSE '> 80 chars'
                        END as length_range,
                        COUNT(*) as count
                    FROM entries
                    WHERE title IS NOT NULL
                    GROUP BY length_range
                    ORDER BY length_range
                `
            };

            const results = {};
            for (const [key, query] of Object.entries(queries)) {
                const result = await pool.query(query);
                results[key] = result.rows;
            }

            return results;
        } catch (error) {
            throw new Error(`Error getting statistics: ${error.message}`);
        }
    }

    // Add entry to user favorites
    async addToFavorites(pdb_id, user_id) {
        try {
            const query = `
                INSERT INTO user_favorites (user_id, pdb_id)
                VALUES ($1, $2)
                ON CONFLICT (user_id, pdb_id) DO NOTHING
                RETURNING *
            `;
            const result = await pool.query(query, [user_id, pdb_id]);
            return result.rows[0];
        } catch (error) {
            throw new Error(`Error adding to favorites: ${error.message}`);
        }
    }

    // Remove entry from user favorites
    async removeFromFavorites(pdb_id, user_id) {
        try {
            const query = `
                DELETE FROM user_favorites
                WHERE user_id = $1 AND pdb_id = $2
                RETURNING *
            `;
            const result = await pool.query(query, [user_id, pdb_id]);
            return result.rows[0];
        } catch (error) {
            throw new Error(`Error removing from favorites: ${error.message}`);
        }
    }

    // Get user favorites
    async getUserFavorites(user_id) {
        try {
            const query = `
                SELECT e.*, uf.created_at as favorited_at
                FROM entries e
                JOIN user_favorites uf ON e.pdb_id = uf.pdb_id
                WHERE uf.user_id = $1
                ORDER BY uf.created_at DESC
            `;
            const result = await pool.query(query, [user_id]);
            return result.rows;
        } catch (error) {
            throw new Error(`Error getting user favorites: ${error.message}`);
        }
    }
}

module.exports = EntryModel;
