// backend/models/SoftwareUsedModel.js
const BaseModel = require('./BaseModel');
const pool = require('../db');

class SoftwareUsedModel extends BaseModel {
    constructor() {
        super('software_used', 'id');
    }

    // Get all software records with pagination
    async readAll(options = {}) {
        const { limit = 50, offset = 0, sortBy = 'pdb_id', sortOrder = 'ASC' } = options;
        const validSortColumns = ['pdb_id', 'software_name', 'software_purpose'];
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

    // Get software by PDB ID
    async getByPdbId(pdbId) {
        const query = `
            SELECT * FROM ${this.tableName}
            WHERE pdb_id = $1
            ORDER BY software_name
        `;
        
        const result = await pool.query(query, [pdbId]);
        return result.rows;
    }

    // Search by software name
    async searchBySoftwareName(softwareName, options = {}) {
        const { limit = 50, offset = 0 } = options;
        const query = `
            SELECT * FROM ${this.tableName}
            WHERE software_name ILIKE $1
            ORDER BY pdb_id
            LIMIT $2 OFFSET $3
        `;
        
        const searchPattern = `%${softwareName}%`;
        const result = await pool.query(query, [searchPattern, limit, offset]);
        return result.rows;
    }

    // Search by software purpose
    async searchByPurpose(purpose, options = {}) {
        const { limit = 50, offset = 0 } = options;
        const query = `
            SELECT * FROM ${this.tableName}
            WHERE software_purpose ILIKE $1
            ORDER BY pdb_id
            LIMIT $2 OFFSET $3
        `;
        
        const searchPattern = `%${purpose}%`;
        const result = await pool.query(query, [searchPattern, limit, offset]);
        return result.rows;
    }

    // Get software statistics
    async getSoftwareStatistics() {
        const query = `
            SELECT 
                COUNT(*) as total_software_records,
                COUNT(DISTINCT pdb_id) as proteins_with_software_info,
                COUNT(DISTINCT software_name) as unique_software_names,
                COUNT(DISTINCT software_purpose) as unique_purposes
            FROM ${this.tableName}
        `;
        
        const result = await pool.query(query);
        return result.rows[0];
    }

    // Get most popular software
    async getTopSoftware(options = {}) {
        const { limit = 20 } = options;
        const query = `
            SELECT 
                software_name,
                COUNT(*) as usage_count,
                COUNT(DISTINCT pdb_id) as protein_count,
                COUNT(DISTINCT version) as version_count
            FROM ${this.tableName}
            WHERE software_name IS NOT NULL AND software_name != ''
            GROUP BY software_name
            ORDER BY usage_count DESC
            LIMIT $1
        `;
        
        const result = await pool.query(query, [limit]);
        return result.rows;
    }

    // Get software by purpose
    async getSoftwareByPurpose(options = {}) {
        const { limit = 50 } = options;
        const query = `
            SELECT 
                software_purpose,
                COUNT(*) as usage_count,
                COUNT(DISTINCT software_name) as unique_software,
                COUNT(DISTINCT pdb_id) as protein_count
            FROM ${this.tableName}
            WHERE software_purpose IS NOT NULL AND software_purpose != ''
            GROUP BY software_purpose
            ORDER BY usage_count DESC
            LIMIT $1
        `;
        
        const result = await pool.query(query, [limit]);
        return result.rows;
    }

    // Get software usage by PDB ID
    async getSoftwareByPdbId(pdbId) {
        const query = `
            SELECT *
            FROM ${this.tableName}
            WHERE pdb_id = $1
            ORDER BY software_name
        `;
        
        const result = await pool.query(query, [pdbId]);
        return result.rows;
    }

    // Get software co-usage patterns
    async getSoftwareCoUsage(options = {}) {
        const { limit = 100 } = options;
        const query = `
            SELECT 
                s1.software_name as software1,
                s2.software_name as software2,
                COUNT(DISTINCT s1.pdb_id) as co_usage_count
            FROM ${this.tableName} s1
            JOIN ${this.tableName} s2 ON s1.pdb_id = s2.pdb_id
            WHERE s1.software_name != s2.software_name
                AND s1.software_name IS NOT NULL 
                AND s2.software_name IS NOT NULL
                AND s1.software_name != ''
                AND s2.software_name != ''
            GROUP BY s1.software_name, s2.software_name
            HAVING COUNT(DISTINCT s1.pdb_id) > 1
            ORDER BY co_usage_count DESC
            LIMIT $1
        `;
        
        const result = await pool.query(query, [limit]);
        return result.rows;
    }

    // Get proteins with multiple software tools
    async getProteinsWithMultipleSoftware(options = {}) {
        const { limit = 50, offset = 0 } = options;
        const query = `
            SELECT 
                pdb_id,
                COUNT(*) as software_count,
                STRING_AGG(DISTINCT software_name, ', ') as software_names,
                STRING_AGG(DISTINCT classification, ', ') as classifications
            FROM ${this.tableName}
            GROUP BY pdb_id
            HAVING COUNT(*) > 1
            ORDER BY software_count DESC
            LIMIT $1 OFFSET $2
        `;
        
        const result = await pool.query(query, [limit, offset]);
        return result.rows;
    }

    // Advanced search with multiple criteria
    async advancedSearch(criteria, options = {}) {
        const { limit = 50, offset = 0 } = options;
        const conditions = [];
        const values = [];
        let paramIndex = 1;

        if (criteria.software_name) {
            conditions.push(`software_name ILIKE $${paramIndex}`);
            values.push(`%${criteria.software_name}%`);
            paramIndex++;
        }

        if (criteria.version) {
            conditions.push(`version ILIKE $${paramIndex}`);
            values.push(`%${criteria.version}%`);
            paramIndex++;
        }

        if (criteria.classification) {
            conditions.push(`classification ILIKE $${paramIndex}`);
            values.push(`%${criteria.classification}%`);
            paramIndex++;
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        
        const query = `
            SELECT * FROM ${this.tableName}
            ${whereClause}
            ORDER BY pdb_id, software_name
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;
        
        values.push(limit, offset);
        const result = await pool.query(query, values);
        return result.rows;
    }

    // Get software evolution timeline
    async getSoftwareEvolutionTimeline(softwareName) {
        const query = `
            SELECT 
                version,
                COUNT(*) as usage_count,
                MIN(created_at) as first_usage,
                MAX(created_at) as last_usage
            FROM ${this.tableName}
            WHERE software_name = $1 AND version IS NOT NULL AND version != ''
            GROUP BY version
            ORDER BY first_usage
        `;
        
        const result = await pool.query(query, [softwareName]);
        return result.rows;
    }

    // Get classification trends
    async getClassificationTrends() {
        const query = `
            SELECT 
                classification,
                COUNT(*) as total_usage,
                COUNT(DISTINCT software_name) as unique_software,
                COUNT(DISTINCT pdb_id) as protein_count,
                AVG(CASE WHEN version IS NOT NULL AND version != '' THEN 1.0 ELSE 0.0 END) as version_reporting_rate
            FROM ${this.tableName}
            WHERE classification IS NOT NULL AND classification != ''
            GROUP BY classification
            ORDER BY total_usage DESC
        `;
        
        const result = await pool.query(query);
        return result.rows;
    }
}

module.exports = SoftwareUsedModel;

