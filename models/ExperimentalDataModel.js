// backend/models/ExperimentalDataModel.js
const BaseModel = require('./BaseModel');
const pool = require('../db');

class ExperimentalDataModel extends BaseModel {
    constructor() {
        super('experimental_data', 'pdb_id');
    }

    // Get all experimental data with pagination
    async readAll(options = {}) {
        const { limit = 50, offset = 0, sortBy = 'pdb_id', sortOrder = 'ASC' } = options;
        const validSortColumns = ['pdb_id', 'method', 'resolution_a'];
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

    // Get experimental data by PDB ID
    async getByPdbId(pdbId) {
        const query = `
            SELECT * FROM ${this.tableName}
            WHERE pdb_id ILIKE $1
            ORDER BY pdb_id
        `;
        
        const result = await pool.query(query, [pdbId]);
        return result.rows;
    }

    // Get data by experimental method
    async getByMethod(method, options = {}) {
        const { limit = 50, offset = 0 } = options;
        const query = `
            SELECT * FROM ${this.tableName}
            WHERE method ILIKE $1
            ORDER BY pdb_id
            LIMIT $2 OFFSET $3
        `;
        
        const searchPattern = `%${method}%`;
        const result = await pool.query(query, [searchPattern, limit, offset]);
        return result.rows;
    }

    // Get data by resolution range
    async getByResolutionRange(minRes, maxRes, options = {}) {
        const { limit = 50, offset = 0 } = options;
        const query = `
            SELECT * FROM ${this.tableName}
            WHERE resolution_a BETWEEN $1 AND $2
            ORDER BY resolution_a
            LIMIT $3 OFFSET $4
        `;
        
        const result = await pool.query(query, [minRes, maxRes, limit, offset]);
        return result.rows;
    }

    // Get data by resolution range
    async getByResolutionRange(minRes, maxRes, options = {}) {
        const { limit = 50, offset = 0 } = options;
        const query = `
            SELECT * FROM ${this.tableName}
            WHERE resolution_a BETWEEN $1 AND $2
            ORDER BY resolution_a
            LIMIT $3 OFFSET $4
        `;
        
        const result = await pool.query(query, [minRes, maxRes, limit, offset]);
        return result.rows;
    }

    // Get experimental statistics
    async getExperimentalDataStatistics() {
        const query = `
            SELECT 
                COUNT(*) as total_experiments,
                COUNT(DISTINCT method) as unique_methods,
                AVG(resolution_a) as avg_resolution,
                MIN(resolution_a) as min_resolution,
                MAX(resolution_a) as max_resolution
            FROM ${this.tableName}
            WHERE resolution_a IS NOT NULL
        `;
        
        const result = await pool.query(query);
        return result.rows[0];
    }

    // Get total count of records
    async getCount() {
        const query = `SELECT COUNT(*) FROM ${this.tableName}`;
        const result = await pool.query(query);
        return parseInt(result.rows[0].count);
    }

    // Search experimental data by PDB ID or method
    async search(searchTerm, options = {}) {
        const { limit = 50, offset = 0 } = options;
        const query = `
            SELECT * FROM ${this.tableName}
            WHERE pdb_id ILIKE $1 OR method ILIKE $2
            ORDER BY pdb_id
            LIMIT $3 OFFSET $4
        `;
        
        const searchPattern = `%${searchTerm}%`;
        const result = await pool.query(query, [searchPattern, searchPattern, limit, offset]);
        return result.rows;
    }

    // Get experimental data by PDB ID
    async getByPdbId(pdbId) {
        const query = `
            SELECT * FROM ${this.tableName}
            WHERE pdb_id ILIKE $1
            ORDER BY pdb_id
        `;
        
        const result = await pool.query(query, [pdbId]);
        return result.rows;
    }

    // Get method distribution
    async getMethodDistribution() {
        const query = `
            SELECT 
                method,
                COUNT(*) as count,
                AVG(resolution_a) as avg_resolution
            FROM ${this.tableName}
            WHERE method IS NOT NULL
            GROUP BY method
            ORDER BY count DESC
        `;
        
        const result = await pool.query(query);
        return result.rows;
    }

    // Get resolution distribution by method
    async getResolutionDistributionByMethod() {
        const query = `
            SELECT 
                method,
                resolution_a,
                COUNT(*) as count
            FROM ${this.tableName}
            WHERE resolution_a IS NOT NULL 
            GROUP BY method, resolution_a
            ORDER BY method, resolution_a
        `;
        
        const result = await pool.query(query);
        return result.rows;
    }

    // Get quality metrics by method
    async getQualityMetricsByMethod() {
        const query = `
            SELECT 
                method,
                COUNT(*) as count,
                AVG(resolution_a) as avg_resolution,
                STDDEV(resolution_a) as stddev_resolution,
                MIN(resolution_a) as min_resolution,
                MAX(resolution_a) as max_resolution
            FROM ${this.tableName}
            WHERE method IS NOT NULL 
                AND resolution_a IS NOT NULL
            GROUP BY method
            ORDER BY avg_resolution
        `;
        
        const result = await pool.query(query);
        return result.rows;
    }

    // Advanced search with multiple criteria
    async advancedSearch(criteria, options = {}) {
        const { limit = 50, offset = 0 } = options;
        const conditions = [];
        const values = [];
        let paramIndex = 1;

        if (criteria.method) {
            conditions.push(`method ILIKE $${paramIndex}`);
            values.push(`%${criteria.method}%`);
            paramIndex++;
        }

        if (criteria.min_resolution) {
            conditions.push(`resolution_a >= $${paramIndex}`);
            values.push(criteria.min_resolution);
            paramIndex++;
        }

        if (criteria.max_resolution) {
            conditions.push(`resolution_a <= $${paramIndex}`);
            values.push(criteria.max_resolution);
            paramIndex++;
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        
        const query = `
            SELECT * FROM ${this.tableName}
            ${whereClause}
            ORDER BY pdb_id
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;
        
        values.push(limit, offset);
        const result = await pool.query(query, values);
        return result.rows;
    }
}

module.exports = ExperimentalDataModel;

