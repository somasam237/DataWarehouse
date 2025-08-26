// backend/models/AuthorsFundingModel.js
const BaseModel = require('./BaseModel');
const pool = require('../db');

class AuthorsFundingModel extends BaseModel {
    constructor() {
        super('authors_funding', 'id');
    }

    // Get all authors/funding records with pagination
    async readAll(options = {}) {
        const { limit = 50, offset = 0, sortBy = 'pdb_id', sortOrder = 'ASC' } = options;
        const validSortColumns = ['pdb_id', 'author_names', 'funding_org'];
        const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'pdb_id';
        const sortDirection = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

        const query = `
            SELECT * FROM ${this.tableName}
            ORDER BY ${sortColumn} ${sortDirection}
            LIMIT $1 OFFSET $2
        `;
        
        const result = await pool.query(query, [limit, offset]);
        return result.rows;
    }

    // Get authors/funding by PDB ID
    async getByPdbId(pdbId) {
        const query = `
            SELECT * FROM ${this.tableName}
            WHERE pdb_id = $1
            ORDER BY id
        `;
        
        const result = await pool.query(query, [pdbId]);
        return result.rows;
    }

    // Search authors by name
    async searchByAuthor(authorName, options = {}) {
        const { limit = 50, offset = 0 } = options;
        const query = `
            SELECT * FROM ${this.tableName}
            WHERE author_names ILIKE $1
            ORDER BY pdb_id
            LIMIT $2 OFFSET $3
        `;
        
        const searchPattern = `%${authorName}%`;
        const result = await pool.query(query, [searchPattern, limit, offset]);
        return result.rows;
    }

    // Search by funding organization
    async searchByFunding(fundingOrg, options = {}) {
        const { limit = 50, offset = 0 } = options;
        const query = `
            SELECT * FROM ${this.tableName}
            WHERE funding_org ILIKE $1
            ORDER BY pdb_id
            LIMIT $2 OFFSET $3
        `;
        
        const searchPattern = `%${fundingOrg}%`;
        const result = await pool.query(query, [searchPattern, limit, offset]);
        return result.rows;
    }

    // Get funding statistics
    async getFundingStatistics() {
        const query = `
            SELECT 
                COUNT(DISTINCT pdb_id) as total_proteins_with_funding,
                COUNT(DISTINCT funding_org) as unique_funding_orgs,
                COUNT(*) as total_funding_records
            FROM ${this.tableName}
            WHERE funding_org IS NOT NULL
        `;
        
        const result = await pool.query(query);
        return result.rows[0];
    }

    // Get top funding organizations
    async getTopFundingOrganizations(options = {}) {
        const { limit = 20 } = options;
        const query = `
            SELECT 
                funding_org,
                COUNT(DISTINCT pdb_id) as protein_count,
                COUNT(*) as total_records
            FROM ${this.tableName}
            WHERE funding_org IS NOT NULL AND funding_org != ''
            GROUP BY funding_org
            ORDER BY protein_count DESC
            LIMIT $1
        `;
        
        const result = await pool.query(query, [limit]);
        return result.rows;
    }

    // Get author name frequency
    async getAuthorNameFrequency(options = {}) {
        const { limit = 50 } = options;
        const query = `
            SELECT 
                author_names,
                COUNT(DISTINCT pdb_id) as protein_count
            FROM ${this.tableName}
            WHERE author_names IS NOT NULL AND author_names != ''
            GROUP BY author_names
            ORDER BY protein_count DESC
            LIMIT $1
        `;
        
        const result = await pool.query(query, [limit]);
        return result.rows;
    }

    // Get author collaboration network
    async getAuthorCollaborations(options = {}) {
        const { limit = 100 } = options;
        const query = `
            SELECT 
                a1.author_names as author1,
                a2.author_names as author2,
                COUNT(DISTINCT a1.pdb_id) as collaboration_count
            FROM ${this.tableName} a1
            JOIN ${this.tableName} a2 ON a1.pdb_id = a2.pdb_id
            WHERE a1.author_names != a2.author_names
                AND a1.author_names IS NOT NULL 
                AND a2.author_names IS NOT NULL
                AND a1.author_names != ''
                AND a2.author_names != ''
            GROUP BY a1.author_names, a2.author_names
            HAVING COUNT(DISTINCT a1.pdb_id) > 1
            ORDER BY collaboration_count DESC
            LIMIT $1
        `;
        
        const result = await pool.query(query, [limit]);
        return result.rows;
    }

    // Get most prolific authors
    async getTopAuthors(options = {}) {
        const { limit = 20 } = options;
        const query = `
            SELECT 
                author_names,
                COUNT(DISTINCT pdb_id) as protein_count
            FROM ${this.tableName}
            WHERE author_names IS NOT NULL AND author_names != ''
            GROUP BY author_names
            ORDER BY protein_count DESC
            LIMIT $1
        `;
        
        const result = await pool.query(query, [limit]);
        return result.rows;
    }
}

module.exports = AuthorsFundingModel;

