// backend/models/CitationModel.js
const BaseModel = require('./BaseModel');

class CitationModel extends BaseModel {
    constructor() {
        super('citations', 'citation_id');
    }

    // Search citations with publication information
    async searchWithPublicationInfo(searchArg, pagination = {}, sort = {}) {
        try {
            const { page = 1, limit = 10 } = pagination;
            const { field = 'publication_year', direction = 'DESC' } = sort;
            const offset = (page - 1) * limit;

            let query = `
                SELECT 
                    c.*,
                    COUNT(DISTINCT ec.pdb_id) as structure_count,
                    array_agg(DISTINCT ec.pdb_id) as structures
                FROM citations c
                LEFT JOIN entry_citations ec ON c.citation_id = ec.citation_id
            `;

            let whereClause = '';
            const params = [];

            if (searchArg) {
                const conditions = [];
                
                if (searchArg.title) {
                    conditions.push(`c.title ILIKE $${params.length + 1}`);
                    params.push(`%${searchArg.title}%`);
                }

                if (searchArg.authors) {
                    conditions.push(`c.authors ILIKE $${params.length + 1}`);
                    params.push(`%${searchArg.authors}%`);
                }

                if (searchArg.journal) {
                    conditions.push(`c.journal ILIKE $${params.length + 1}`);
                    params.push(`%${searchArg.journal}%`);
                }

                if (searchArg.year) {
                    conditions.push(`c.publication_year = $${params.length + 1}`);
                    params.push(searchArg.year);
                }

                if (searchArg.yearFrom) {
                    conditions.push(`c.publication_year >= $${params.length + 1}`);
                    params.push(searchArg.yearFrom);
                }

                if (searchArg.yearTo) {
                    conditions.push(`c.publication_year <= $${params.length + 1}`);
                    params.push(searchArg.yearTo);
                }

                if (searchArg.pubmed_id) {
                    conditions.push(`c.pubmed_id = $${params.length + 1}`);
                    params.push(searchArg.pubmed_id);
                }

                if (searchArg.doi) {
                    conditions.push(`c.doi = $${params.length + 1}`);
                    params.push(searchArg.doi);
                }

                if (conditions.length > 0) {
                    whereClause = `WHERE ${conditions.join(' AND ')}`;
                }
            }

            // Count query
            const countQuery = `
                SELECT COUNT(DISTINCT c.citation_id) FROM citations c
                ${whereClause}
            `;
            const countResult = await pool.query(countQuery, params);
            const total = parseInt(countResult.rows[0].count);

            // Data query
            const dataQuery = `
                ${query}
                ${whereClause}
                GROUP BY c.citation_id
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
            throw new Error(`Error searching citations: ${error.message}`);
        }
    }

    // Get citation with all related structures
    async getCitationWithStructures(citation_id) {
        try {
            const citation = await this.readOne(citation_id);
            if (!citation) return null;

            const query = `
                SELECT 
                    e.pdb_id,
                    e.title,
                    e.deposition_date,
                    e.experimental_method,
                    e.resolution,
                    ec.citation_type
                FROM entries e
                JOIN entry_citations ec ON e.pdb_id = ec.pdb_id
                WHERE ec.citation_id = $1
                ORDER BY e.deposition_date DESC
            `;
            const result = await pool.query(query, [citation_id]);
            
            return {
                ...citation,
                structures: result.rows
            };
        } catch (error) {
            throw new Error(`Error getting citation with structures: ${error.message}`);
        }
    }

    // Get citation statistics
    async getCitationStatistics() {
        try {
            const queries = {
                yearDistribution: `
                    SELECT 
                        publication_year,
                        COUNT(*) as count
                    FROM citations
                    WHERE publication_year IS NOT NULL
                    GROUP BY publication_year
                    ORDER BY publication_year DESC
                `,
                journalDistribution: `
                    SELECT 
                        journal,
                        COUNT(*) as count
                    FROM citations
                    WHERE journal IS NOT NULL
                    GROUP BY journal
                    ORDER BY count DESC
                    LIMIT 20
                `,
                mostCitedPapers: `
                    SELECT 
                        c.title,
                        c.authors,
                        c.journal,
                        c.publication_year,
                        COUNT(DISTINCT ec.pdb_id) as structure_count
                    FROM citations c
                    LEFT JOIN entry_citations ec ON c.citation_id = ec.citation_id
                    GROUP BY c.citation_id, c.title, c.authors, c.journal, c.publication_year
                    ORDER BY structure_count DESC
                    LIMIT 10
                `,
                publicationTrends: `
                    SELECT 
                        publication_year,
                        COUNT(*) as publications,
                        COUNT(DISTINCT ec.pdb_id) as structures
                    FROM citations c
                    LEFT JOIN entry_citations ec ON c.citation_id = ec.citation_id
                    WHERE publication_year IS NOT NULL
                    GROUP BY publication_year
                    ORDER BY publication_year DESC
                `
            };

            const results = {};
            for (const [key, query] of Object.entries(queries)) {
                const result = await pool.query(query);
                results[key] = result.rows;
            }

            return results;
        } catch (error) {
            throw new Error(`Error getting citation statistics: ${error.message}`);
        }
    }

    // Find related citations by co-occurrence in structures
    async findRelatedCitations(citation_id, limit = 10) {
        try {
            const query = `
                SELECT 
                    c2.citation_id,
                    c2.title,
                    c2.authors,
                    c2.journal,
                    c2.publication_year,
                    COUNT(DISTINCT ec1.pdb_id) as cooccurrence_count,
                    array_agg(DISTINCT ec1.pdb_id) as shared_structures
                FROM entry_citations ec1
                JOIN entry_citations ec2 ON ec1.pdb_id = ec2.pdb_id
                JOIN citations c2 ON ec2.citation_id = c2.citation_id
                WHERE ec1.citation_id = $1 AND ec2.citation_id != $1
                GROUP BY c2.citation_id, c2.title, c2.authors, c2.journal, c2.publication_year
                ORDER BY cooccurrence_count DESC
                LIMIT $2
            `;
            const result = await pool.query(query, [citation_id, limit]);
            return result.rows;
        } catch (error) {
            throw new Error(`Error finding related citations: ${error.message}`);
        }
    }

    // Get author collaboration network
    async getAuthorCollaborations(limit = 50) {
        try {
            const query = `
                SELECT 
                    TRIM(unnest(string_to_array(authors, ','))) as author,
                    COUNT(DISTINCT citation_id) as publication_count,
                    COUNT(DISTINCT ec.pdb_id) as structure_count
                FROM citations c
                LEFT JOIN entry_citations ec ON c.citation_id = ec.citation_id
                WHERE authors IS NOT NULL
                GROUP BY author
                HAVING COUNT(DISTINCT citation_id) > 1
                ORDER BY publication_count DESC
                LIMIT $1
            `;
            const result = await pool.query(query, [limit]);
            return result.rows;
        } catch (error) {
            throw new Error(`Error getting author collaborations: ${error.message}`);
        }
    }

    // Add or update citation relationships
    async addCitationToEntry(pdb_id, citation_data) {
        try {
            const { citation_id, citation_type } = citation_data;
            
            const query = `
                INSERT INTO entry_citations (pdb_id, citation_id, citation_type)
                VALUES ($1, $2, $3)
                ON CONFLICT (pdb_id, citation_id) DO UPDATE SET
                    citation_type = EXCLUDED.citation_type
                RETURNING *
            `;
            const result = await pool.query(query, [pdb_id, citation_id, citation_type]);
            return result.rows[0];
        } catch (error) {
            throw new Error(`Error adding citation to entry: ${error.message}`);
        }
    }

    // Remove citation from entry
    async removeCitationFromEntry(pdb_id, citation_id) {
        try {
            const query = `
                DELETE FROM entry_citations
                WHERE pdb_id = $1 AND citation_id = $2
                RETURNING *
            `;
            const result = await pool.query(query, [pdb_id, citation_id]);
            return result.rows[0];
        } catch (error) {
            throw new Error(`Error removing citation from entry: ${error.message}`);
        }
    }

    // Search citations by full text
    async fullTextSearch(searchText, pagination = {}) {
        try {
            const { page = 1, limit = 10 } = pagination;
            const offset = (page - 1) * limit;

            const query = `
                SELECT 
                    c.*,
                    COUNT(DISTINCT ec.pdb_id) as structure_count,
                    ts_rank(to_tsvector('english', c.title || ' ' || COALESCE(c.abstract, '') || ' ' || COALESCE(c.authors, '')), plainto_tsquery('english', $1)) as relevance
                FROM citations c
                LEFT JOIN entry_citations ec ON c.citation_id = ec.citation_id
                WHERE to_tsvector('english', c.title || ' ' || COALESCE(c.abstract, '') || ' ' || COALESCE(c.authors, '')) @@ plainto_tsquery('english', $1)
                GROUP BY c.citation_id
                ORDER BY relevance DESC
                LIMIT $2 OFFSET $3
            `;

            const countQuery = `
                SELECT COUNT(*) FROM citations c
                WHERE to_tsvector('english', c.title || ' ' || COALESCE(c.abstract, '') || ' ' || COALESCE(c.authors, '')) @@ plainto_tsquery('english', $1)
            `;

            const [dataResult, countResult] = await Promise.all([
                pool.query(query, [searchText, limit, offset]),
                pool.query(countQuery, [searchText])
            ]);

            const total = parseInt(countResult.rows[0].count);

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
            throw new Error(`Error performing full text search: ${error.message}`);
        }
    }

    // Update citation metadata
    async updateCitationMetadata(citation_id, metadata) {
        try {
            const { abstract, keywords } = metadata;
            
            const query = `
                UPDATE citations 
                SET abstract = $2, keywords = $3, updated_at = CURRENT_TIMESTAMP
                WHERE citation_id = $1
                RETURNING *
            `;
            const result = await pool.query(query, [citation_id, abstract, keywords]);
            return result.rows[0];
        } catch (error) {
            throw new Error(`Error updating citation metadata: ${error.message}`);
        }
    }
}

module.exports = CitationModel;
