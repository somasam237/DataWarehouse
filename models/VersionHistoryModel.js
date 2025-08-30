// backend/models/VersionHistoryModel.js
const BaseModel = require('./BaseModel');
const pool = require('../db');

class VersionHistoryModel extends BaseModel {
    constructor() {
        super('version_history', 'id');
    }

    // Get all version history records with pagination
    async readAll(options = {}) {
        const { limit = 50, offset = 0, sortBy = 'pdb_id', sortOrder = 'ASC' } = options;
        const validSortColumns = ['pdb_id', 'version', 'release_date'];
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

    // Get version history by PDB ID
    async getByPdbId(pdbId) {
        const query = `
            SELECT * FROM ${this.tableName}
            WHERE pdb_id = $1
            ORDER BY release_date DESC
        `;
        
        const result = await pool.query(query, [pdbId]);
        return result.rows;
    }

    // Get version history statistics
    async getVersionStatistics() {
        const query = `
            SELECT 
                COUNT(*) as total_version_records,
                COUNT(DISTINCT pdb_id) as proteins_with_versions,
                COUNT(DISTINCT version) as unique_versions,
                MIN(release_date) as earliest_release,
                MAX(release_date) as latest_release
            FROM ${this.tableName}
        `;
        
        const result = await pool.query(query);
        return result.rows[0];
    }

    // Advanced search for version history
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

        if (criteria.version) {
            conditions.push(`version = $${paramIndex}`);
            values.push(criteria.version);
            paramIndex++;
        }

        if (criteria.start_date) {
            conditions.push(`release_date >= $${paramIndex}`);
            values.push(criteria.start_date);
            paramIndex++;
        }

        if (criteria.end_date) {
            conditions.push(`release_date <= $${paramIndex}`);
            values.push(criteria.end_date);
            paramIndex++;
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        
        const query = `
            SELECT * FROM ${this.tableName}
            ${whereClause}
            ORDER BY release_date DESC
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;
        
        values.push(limit, offset);
        const result = await pool.query(query, values);
        return result.rows;
    }

    // Get revision type distribution
    async getRevisionTypeDistribution() {
        const query = `
            SELECT 
                CASE 
                    WHEN changes ILIKE '%initial%' THEN 'Initial Release'
                    WHEN changes ILIKE '%update%' THEN 'Update'
                    WHEN changes ILIKE '%correction%' THEN 'Correction'
                    WHEN changes ILIKE '%revision%' THEN 'Revision'
                    ELSE 'Other'
                END as revision_type,
                COUNT(*) as count
            FROM ${this.tableName}
            GROUP BY revision_type
            ORDER BY count DESC
        `;
        
        const result = await pool.query(query);
        return result.rows;
    }

    // Get total count of records
    async getCount() {
        const query = `SELECT COUNT(*) FROM ${this.tableName}`;
        const result = await pool.query(query);
        return parseInt(result.rows[0].count);
    }
}

module.exports = VersionHistoryModel;

