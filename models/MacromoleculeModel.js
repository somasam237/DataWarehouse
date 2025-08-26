// backend/models/MacromoleculeModel.js
const BaseModel = require('./BaseModel');
const pool = require('../db');

class MacromoleculeModel extends BaseModel {
    constructor() {
        super('macromolecule', 'id');
    }

    // Get all macromolecules with pagination
    async readAll(options = {}) {
        const { limit = 50, offset = 0, sortBy = 'pdb_id', sortOrder = 'ASC' } = options;
        const validSortColumns = ['pdb_id', 'entity_id', 'molecule_name'];
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

    // Get macromolecules by PDB ID
    async getByPdbId(pdbId) {
        const query = `
            SELECT * FROM ${this.tableName}
            WHERE pdb_id = $1
            ORDER BY entity_id
        `;
        
        const result = await pool.query(query, [pdbId]);
        return result.rows;
    }

    // Get macromolecule by PDB ID and entity ID
    async getByPdbIdAndEntity(pdbId, entityId) {
        const query = `
            SELECT * FROM ${this.tableName}
            WHERE pdb_id = $1 AND entity_id = $2
        `;
        
        const result = await pool.query(query, [pdbId, entityId]);
        return result.rows[0];
    }

    // Search macromolecules by molecule name
    async searchByMoleculeName(moleculeName, options = {}) {
        const { limit = 50, offset = 0 } = options;
        const searchPattern = `%${moleculeName}%`;
        const query = `
            SELECT * FROM ${this.tableName}
            WHERE molecule_name ILIKE $1
            ORDER BY molecule_name
            LIMIT $2 OFFSET $3
        `;
        
        const result = await pool.query(query, [searchPattern, limit, offset]);
        return result.rows;
    }

    // Get macromolecules by entity ID
    async getByEntityId(entityId, options = {}) {
        const { limit = 50, offset = 0 } = options;
        const query = `
            SELECT * FROM ${this.tableName}
            WHERE entity_id = $1
            ORDER BY pdb_id
            LIMIT $2 OFFSET $3
        `;
        
        const result = await pool.query(query, [entityId, limit, offset]);
        return result.rows;
    }

    // Get macromolecule statistics
    async getMacromoleculeStatistics() {
        const query = `
            SELECT 
                COUNT(*) as total_macromolecules,
                COUNT(DISTINCT pdb_id) as unique_proteins,
                COUNT(DISTINCT entity_id) as unique_entities,
                COUNT(DISTINCT molecule_name) as unique_molecule_names
            FROM ${this.tableName}
        `;
        
        const result = await pool.query(query);
        return result.rows[0];
    }

    // Get molecule name distribution
    async getMoleculeNameDistribution() {
        const query = `
            SELECT 
                molecule_name,
                COUNT(*) as count,
                COUNT(DISTINCT pdb_id) as protein_count
            FROM ${this.tableName}
            WHERE molecule_name IS NOT NULL AND molecule_name != ''
            GROUP BY molecule_name
            ORDER BY count DESC
        `;
        
        const result = await pool.query(query);
        return result.rows;
    }

    // Advanced search for macromolecules
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

        if (criteria.entity_id) {
            conditions.push(`entity_id = $${paramIndex}`);
            values.push(criteria.entity_id);
            paramIndex++;
        }

        if (criteria.molecule_name) {
            conditions.push(`molecule_name ILIKE $${paramIndex}`);
            values.push(`%${criteria.molecule_name}%`);
            paramIndex++;
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        
        const query = `
            SELECT * FROM ${this.tableName}
            ${whereClause}
            ORDER BY pdb_id, entity_id
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;
        
        values.push(limit, offset);
        const result = await pool.query(query, values);
        return result.rows;
    }
}

module.exports = MacromoleculeModel;

