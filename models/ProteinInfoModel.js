// backend/models/ProteinInfoModel.js
const BaseModel = require('./BaseModel');
const pool = require('../db');

class ProteinInfoModel extends BaseModel {
    constructor() {
        super('protein_info', 'pdb_id');
    }

    // Override readOne to support case-insensitive PDB ID lookups
    async readOne(pdbId) {
        try {
            const query = `SELECT * FROM ${this.tableName} WHERE LOWER(${this.primaryKey}) = LOWER($1)`;
            const result = await pool.query(query, [pdbId]);
            return result.rows[0] || null;
        } catch (error) {
            throw new Error(`Error reading ${this.tableName} with PDB ID ${pdbId}: ${error.message}`);
        }
    }

    // Override update to support case-insensitive PDB ID lookups
    async update(pdbId, recordData) {
        try {
            // Define valid columns for protein_info table
            const validColumns = [
                'pdb_id', 'title', 'classification', 'organism', 'expression_system', 
                'mutations', 'deposited_date', 'released_date', 'molecular_weight_kda', 
                'atom_count', 'residue_count_modeled', 'residue_count_deposited', 
                'unique_chains', 'global_symmetry', 'global_stoichiometry', 'image_url'
            ];
            
            // Filter out invalid fields
            const filteredData = {};
            Object.keys(recordData).forEach(key => {
                if (validColumns.includes(key)) {
                    filteredData[key] = recordData[key];
                }
            });
            
            const fields = Object.keys(filteredData);
            const values = Object.values(filteredData);
            
            if (fields.length === 0) {
                throw new Error('No valid fields to update');
            }
            
            const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
            
            const query = `
                UPDATE ${this.tableName} 
                SET ${setClause}
                WHERE LOWER(${this.primaryKey}) = LOWER($1) 
                RETURNING *
            `;
            
            const result = await pool.query(query, [pdbId, ...values]);
            return result.rows[0] || null;
        } catch (error) {
            throw new Error(`Error updating ${this.tableName} with PDB ID ${pdbId}: ${error.message}`);
        }
    }

    // Override delete to support case-insensitive PDB ID lookups
    async delete(pdbId) {
        try {
            const query = `DELETE FROM ${this.tableName} WHERE LOWER(${this.primaryKey}) = LOWER($1) RETURNING *`;
            const result = await pool.query(query, [pdbId]);
            return result.rows[0] || null;
        } catch (error) {
            throw new Error(`Error deleting ${this.tableName} with PDB ID ${pdbId}: ${error.message}`);
        }
    }

    // Get all proteins with pagination and sorting
    async readAll(options = {}) {
        const { limit = 50, offset = 0, sortBy = 'pdb_id', sortOrder = 'ASC' } = options;
        const validSortOrder = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
        const validSortBy = ['pdb_id', 'title', 'organism', 'classification', 'molecular_weight', 'deposited_date']
            .includes(sortBy) ? sortBy : 'pdb_id';

        const query = `
            SELECT * FROM ${this.tableName}
            ORDER BY ${validSortBy} ${validSortOrder}
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
        const whereClauses = [];
        const params = [];

        if (criteria.title) {
            params.push(`%${criteria.title}%`);
            whereClauses.push(`title ILIKE $${params.length}`);
        }
        if (criteria.pdb_id) {
            params.push(`%${criteria.pdb_id}%`);
            whereClauses.push(`pdb_id ILIKE $${params.length}`);
        }
        if (criteria.organism) {
            params.push(`%${criteria.organism}%`);
            whereClauses.push(`organism ILIKE $${params.length}`);
        }
        if (criteria.classification) {
            params.push(`%${criteria.classification}%`);
            whereClauses.push(`classification ILIKE $${params.length}`);
        }
        if (criteria.min_molecular_weight) {
            params.push(criteria.min_molecular_weight);
            whereClauses.push(`molecular_weight >= $${params.length}`);
        }
        if (criteria.max_molecular_weight) {
            params.push(criteria.max_molecular_weight);
            whereClauses.push(`molecular_weight <= $${params.length}`);
        }
        if (criteria.start_date) {
            params.push(criteria.start_date);
            whereClauses.push(`deposited_date >= $${params.length}`);
        }
        if (criteria.end_date) {
            params.push(criteria.end_date);
            whereClauses.push(`deposited_date <= $${params.length}`);
        }

        const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
        const query = `
            SELECT * FROM ${this.tableName}
            ${whereClause}
            ORDER BY pdb_id
            LIMIT $${params.length + 1} OFFSET $${params.length + 2}
        `;

        const result = await pool.query(query, [...params, limit, offset]);
        return result.rows;
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
            WHERE molecular_weight BETWEEN $1 AND $2
            ORDER BY molecular_weight
            LIMIT $3 OFFSET $4
        `;

        const result = await pool.query(query, [minWeight, maxWeight, limit, offset]);
        return result.rows;
    }

    // Get proteins by date range
    async getByDateRange(startDate, endDate, options = {}) {
        const { limit = 50, offset = 0 } = options;
        const query = `
            SELECT * FROM ${this.tableName}
            WHERE deposited_date BETWEEN $1 AND $2
            ORDER BY deposited_date
            LIMIT $3 OFFSET $4
        `;

        const result = await pool.query(query, [startDate, endDate, limit, offset]);
        return result.rows;
    }

    // Statistics and distributions
    async getStatistics() {
        const query = `
            SELECT 
                COUNT(*) AS total_proteins,
                AVG(molecular_weight) AS avg_molecular_weight,
                MIN(molecular_weight) AS min_molecular_weight,
                MAX(molecular_weight) AS max_molecular_weight
            FROM ${this.tableName}
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

    async getClassificationDistribution() {
        const query = `
            SELECT classification, COUNT(*) AS count
            FROM ${this.tableName}
            GROUP BY classification
            ORDER BY count DESC
        `;

        const result = await pool.query(query);
        return result.rows;
    }

    async getOrganismDistribution() {
        const query = `
            SELECT organism, COUNT(*) AS count
            FROM ${this.tableName}
            GROUP BY organism
            ORDER BY count DESC
        `;

        const result = await pool.query(query);
        return result.rows;
    }

    async getMolecularWeightDistribution() {
        const query = `
            SELECT 
                width_bucket(molecular_weight, 0, 500000, 10) AS bucket,
                COUNT(*) AS count
            FROM ${this.tableName}
            GROUP BY bucket
            ORDER BY bucket
        `;

        const result = await pool.query(query);
        return result.rows;
    }
}

module.exports = ProteinInfoModel;
