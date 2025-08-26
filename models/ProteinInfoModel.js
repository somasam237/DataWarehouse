// backend/models/ProteinInfoModel.js
const BaseModel = require('./BaseModel');
const pool = require('../db');

class ProteinInfoModel extends BaseModel {
    constructor() {
        super('protein_info', 'pdb_id');
    }

    // Get all proteins with pagination and sorting
    async readAll(options = {}) {
        const { limit = 50, offset = 0, sortBy = 'pdb_id', sortOrder = 'ASC' } = options;
        const validSortColumns = ['pdb_id', 'title', 'deposited_date', 'classification', 'resolution_a'];
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

    // Search proteins by title or PDB ID
    async search(searchTerm, options = {}) {
        const { limit = 50, offset = 0 } = options;
        const query = `
            SELECT * FROM ${this.tableName}
            WHERE title ILIKE $1 OR pdb_id ILIKE $2
            ORDER BY pdb_id
            LIMIT $3 OFFSET $4
        `;
        
        const searchPattern = `%${searchTerm}%`;
        const result = await pool.query(query, [searchPattern, searchPattern, limit, offset]);
        return result.rows;
    }

    // Advanced search with multiple criteria
    async advancedSearch(criteria, options = {}) {
        const { limit = 50, offset = 0 } = options;
        const conditions = [];
        const values = [];
        let paramIndex = 1;

        if (criteria.title) {
            conditions.push(`title ILIKE $${paramIndex}`);
            values.push(`%${criteria.title}%`);
            paramIndex++;
        }

        if (criteria.classification) {
            conditions.push(`classification ILIKE $${paramIndex}`);
            values.push(`%${criteria.classification}%`);
            paramIndex++;
        }

        if (criteria.organism) {
            conditions.push(`organism ILIKE $${paramIndex}`);
            values.push(`%${criteria.organism}%`);
            paramIndex++;
        }

        if (criteria.deposited_date_from) {
            conditions.push(`deposited_date >= $${paramIndex}`);
            values.push(criteria.deposited_date_from);
            paramIndex++;
        }

        if (criteria.deposited_date_to) {
            conditions.push(`deposited_date <= $${paramIndex}`);
            values.push(criteria.deposited_date_to);
            paramIndex++;
        }

        if (criteria.min_molecular_weight) {
            conditions.push(`molecular_weight_kda >= $${paramIndex}`);
            values.push(criteria.min_molecular_weight);
            paramIndex++;
        }

        if (criteria.max_molecular_weight) {
            conditions.push(`molecular_weight_kda <= $${paramIndex}`);
            values.push(criteria.max_molecular_weight);
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

    // Get protein statistics
    async getStatistics() {
        const query = `
            SELECT 
                COUNT(*) as total_proteins,
                COUNT(DISTINCT classification) as unique_classifications,
                AVG(molecular_weight_kda) as avg_molecular_weight,
                MIN(molecular_weight_kda) as min_molecular_weight,
                MAX(molecular_weight_kda) as max_molecular_weight,
                MIN(deposited_date) as earliest_date,
                MAX(deposited_date) as latest_date,
                AVG(atom_count) as avg_atom_count,
                AVG(residue_count_modeled) as avg_residue_count
            FROM ${this.tableName}
            WHERE molecular_weight_kda IS NOT NULL
        `;
        
        const result = await pool.query(query);
        return result.rows[0];
    }

    // Get proteins by classification
    async getByClassification(classification, options = {}) {
        const { limit = 50, offset = 0 } = options;
        const query = `
            SELECT * FROM ${this.tableName}
            WHERE classification ILIKE $1
            ORDER BY pdb_id
            LIMIT $2 OFFSET $3
        `;
        
        const result = await pool.query(query, [`%${classification}%`, limit, offset]);
        return result.rows;
    }

    // Get proteins by organism  
    async getByOrganism(organism, options = {}) {
        const { limit = 50, offset = 0 } = options;
        const query = `
            SELECT * FROM ${this.tableName}
            WHERE organism ILIKE $1
            ORDER BY pdb_id
            LIMIT $2 OFFSET $3
        `;
        
        const result = await pool.query(query, [`%${organism}%`, limit, offset]);
        return result.rows;
    }

    // Get proteins by molecular weight range
    async getByMolecularWeightRange(minWeight, maxWeight, options = {}) {
        const { limit = 50, offset = 0 } = options;
        const query = `
            SELECT * FROM ${this.tableName}
            WHERE molecular_weight_kda BETWEEN $1 AND $2
            ORDER BY molecular_weight_kda
            LIMIT $3 OFFSET $4
        `;
        
        const result = await pool.query(query, [minWeight, maxWeight, limit, offset]);
        return result.rows;
    }

    // Get proteins by deposition date range
    async getByDateRange(startDate, endDate, options = {}) {
        const { limit = 50, offset = 0 } = options;
        const query = `
            SELECT * FROM ${this.tableName}
            WHERE deposited_date BETWEEN $1 AND $2
            ORDER BY deposited_date DESC
            LIMIT $3 OFFSET $4
        `;
        
        const result = await pool.query(query, [startDate, endDate, limit, offset]);
        return result.rows;
    }

    // Get classification distribution
    async getClassificationDistribution() {
        const query = `
            SELECT 
                classification,
                COUNT(*) as count,
                AVG(molecular_weight_kda) as avg_molecular_weight
            FROM ${this.tableName}
            WHERE classification IS NOT NULL
            GROUP BY classification
            ORDER BY count DESC
        `;
        
        const result = await pool.query(query);
        return result.rows;
    }

    // Get organism distribution
    async getOrganismDistribution() {
        const query = `
            SELECT 
                organism,
                COUNT(*) as count,
                AVG(molecular_weight_kda) as avg_molecular_weight
            FROM ${this.tableName}
            WHERE organism IS NOT NULL
            GROUP BY organism
            ORDER BY count DESC
            LIMIT 50
        `;
        
        const result = await pool.query(query);
        return result.rows;
    }

    // Get molecular weight distribution
    async getMolecularWeightDistribution() {
        const query = `
            SELECT 
                CASE 
                    WHEN molecular_weight_kda < 10 THEN '<10 kDa'
                    WHEN molecular_weight_kda < 25 THEN '10-25 kDa'
                    WHEN molecular_weight_kda < 50 THEN '25-50 kDa'
                    WHEN molecular_weight_kda < 100 THEN '50-100 kDa'
                    ELSE '>100 kDa'
                END as weight_range,
                COUNT(*) as count
            FROM ${this.tableName}
            WHERE molecular_weight_kda IS NOT NULL
            GROUP BY weight_range
            ORDER BY 
                CASE 
                    WHEN molecular_weight_kda < 10 THEN 1
                    WHEN molecular_weight_kda < 25 THEN 2
                    WHEN molecular_weight_kda < 50 THEN 3
                    WHEN molecular_weight_kda < 100 THEN 4
                    ELSE 5
                END
        `;
        
        const result = await pool.query(query);
        return result.rows;
    }
}

module.exports = ProteinInfoModel;
