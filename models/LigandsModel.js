// backend/models/LigandsModel.js
const BaseModel = require('./BaseModel');
const pool = require('../db');

class LigandsModel extends BaseModel {
    constructor() {
        super('ligands', 'id');
    }

    // Get all ligands with pagination
    async readAll(options = {}) {
        const { limit = 50, offset = 0, sortBy = 'pdb_id', sortOrder = 'ASC' } = options;
        const validSortColumns = ['pdb_id', 'ligand_id', 'ligand_name'];
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

    // Get ligands by PDB ID
    async getByPdbId(pdbId) {
        const query = `
            SELECT * FROM ${this.tableName}
            WHERE pdb_id = $1
            ORDER BY ligand_id
        `;
        
        const result = await pool.query(query, [pdbId]);
        return result.rows;
    }

    // Get ligand by specific ligand ID
    async getByLigandId(ligandId, options = {}) {
        const { limit = 50, offset = 0 } = options;
        const query = `
            SELECT * FROM ${this.tableName}
            WHERE ligand_id = $1
            ORDER BY pdb_id
            LIMIT $2 OFFSET $3
        `;
        
        const result = await pool.query(query, [ligandId, limit, offset]);
        return result.rows;
    }

    // Search ligands by name
    async searchByLigandName(ligandName, options = {}) {
        const { limit = 50, offset = 0 } = options;
        const searchPattern = `%${ligandName}%`;
        const query = `
            SELECT * FROM ${this.tableName}
            WHERE ligand_name ILIKE $1
            ORDER BY ligand_name
            LIMIT $2 OFFSET $3
        `;
        
        const result = await pool.query(query, [searchPattern, limit, offset]);
        return result.rows;
    }

    // Get ligand statistics
    async getLigandStatistics() {
        const query = `
            SELECT 
                COUNT(*) as total_ligands,
                COUNT(DISTINCT pdb_id) as proteins_with_ligands,
                COUNT(DISTINCT ligand_id) as unique_ligand_ids,
                COUNT(DISTINCT ligand_name) as unique_ligand_names
            FROM ${this.tableName}
        `;
        
        const result = await pool.query(query);
        return result.rows[0];
    }

    // Advanced search for ligands
    async advancedSearch(criteria, options = {}) {
        const { limit = 50, offset = 0 } = options;
        let conditions = [];
        let values = [];
        let paramIndex = 1;

        if (criteria.pdb_id) {
            conditions.push(`pdb_id ILIKE $${paramIndex}`);
            values.push(`%${criteria.pdb_id}%`);
            paramIndex++;
        }

        if (criteria.ligand_id) {
            conditions.push(`ligand_id ILIKE $${paramIndex}`);
            values.push(`%${criteria.ligand_id}%`);
            paramIndex++;
        }

        if (criteria.ligand_name) {
            conditions.push(`ligand_name ILIKE $${paramIndex}`);
            values.push(`%${criteria.ligand_name}%`);
            paramIndex++;
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        
        const query = `
            SELECT * FROM ${this.tableName}
            ${whereClause}
            ORDER BY pdb_id, ligand_id
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;
        
        values.push(limit, offset);
        const result = await pool.query(query, values);
        return result.rows;
    }
}

module.exports = LigandsModel;

