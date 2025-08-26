// backend/models/BaseModel.js
// Base class implementing the 5 required functions for all data models
const pool = require('../db');

class BaseModel {
    constructor(tableName, primaryKey = 'id') {
        this.tableName = tableName;
        this.primaryKey = primaryKey;
    }

    // 1. readOne(id) - Read a single record by ID
    async readOne(id) {
        try {
            const query = `SELECT * FROM ${this.tableName} WHERE ${this.primaryKey} = $1`;
            const result = await pool.query(query, [id]);
            return result.rows[0] || null;
        } catch (error) {
            throw new Error(`Error reading ${this.tableName} with ID ${id}: ${error.message}`);
        }
    }

    // 2. search(searchArg, pagination, sort) - Search with logical expressions
    async search(searchArg, pagination = {}, sort = {}) {
        try {
            const { page = 1, limit = 10 } = pagination;
            const { field = this.primaryKey, direction = 'ASC' } = sort;
            const offset = (page - 1) * limit;

            // Build WHERE clause from search argument tree
            const whereClause = this.buildWhereClause(searchArg);
            
            // Count query for pagination
            const countQuery = `SELECT COUNT(*) FROM ${this.tableName} ${whereClause.sql}`;
            const countResult = await pool.query(countQuery, whereClause.params);
            const total = parseInt(countResult.rows[0].count);

            // Data query with pagination and sorting
            const dataQuery = `
                SELECT * FROM ${this.tableName} 
                ${whereClause.sql} 
                ORDER BY ${field} ${direction} 
                LIMIT $${whereClause.params.length + 1} 
                OFFSET $${whereClause.params.length + 2}
            `;
            const dataResult = await pool.query(dataQuery, [...whereClause.params, limit, offset]);

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
            throw new Error(`Error searching ${this.tableName}: ${error.message}`);
        }
    }

    // 3. create(recordData) - Create a new record
    async create(recordData) {
        try {
            const fields = Object.keys(recordData);
            const values = Object.values(recordData);
            const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');
            
            const query = `
                INSERT INTO ${this.tableName} (${fields.join(', ')}) 
                VALUES (${placeholders}) 
                RETURNING *
            `;
            
            const result = await pool.query(query, values);
            return result.rows[0];
        } catch (error) {
            throw new Error(`Error creating ${this.tableName}: ${error.message}`);
        }
    }

    // 4. update(id, recordData) - Update an existing record
    async update(id, recordData) {
        try {
            const fields = Object.keys(recordData);
            const values = Object.values(recordData);
            const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
            
            const query = `
                UPDATE ${this.tableName} 
                SET ${setClause}, updated_at = CURRENT_TIMESTAMP 
                WHERE ${this.primaryKey} = $1 
                RETURNING *
            `;
            
            const result = await pool.query(query, [id, ...values]);
            return result.rows[0] || null;
        } catch (error) {
            throw new Error(`Error updating ${this.tableName} with ID ${id}: ${error.message}`);
        }
    }

    // 5. delete(id) - Delete a record
    async delete(id) {
        try {
            const query = `DELETE FROM ${this.tableName} WHERE ${this.primaryKey} = $1 RETURNING *`;
            const result = await pool.query(query, [id]);
            return result.rows[0] || null;
        } catch (error) {
            throw new Error(`Error deleting ${this.tableName} with ID ${id}: ${error.message}`);
        }
    }

    // Helper method to build WHERE clause from search argument tree
    buildWhereClause(searchArg) {
        if (!searchArg || Object.keys(searchArg).length === 0) {
            return { sql: '', params: [] };
        }

        const params = [];
        const sql = this.buildCondition(searchArg, params);
        
        return {
            sql: sql ? `WHERE ${sql}` : '',
            params
        };
    }

    // Recursive method to build conditions from search tree
    buildCondition(condition, params) {
        if (!condition) return '';

        // Handle logical operators (and, or)
        if (condition.and) {
            const conditions = condition.and.map(cond => this.buildCondition(cond, params)).filter(Boolean);
            return conditions.length > 0 ? `(${conditions.join(' AND ')})` : '';
        }

        if (condition.or) {
            const conditions = condition.or.map(cond => this.buildCondition(cond, params)).filter(Boolean);
            return conditions.length > 0 ? `(${conditions.join(' OR ')})` : '';
        }

        // Handle field conditions
        if (condition.field && condition.operator && condition.value !== undefined) {
            const paramIndex = params.length + 1;
            params.push(condition.value);

            switch (condition.operator) {
                case 'eq':
                    return `${condition.field} = $${paramIndex}`;
                case 'ne':
                    return `${condition.field} != $${paramIndex}`;
                case 'gt':
                    return `${condition.field} > $${paramIndex}`;
                case 'gte':
                    return `${condition.field} >= $${paramIndex}`;
                case 'lt':
                    return `${condition.field} < $${paramIndex}`;
                case 'lte':
                    return `${condition.field} <= $${paramIndex}`;
                case 'like':
                    return `${condition.field} ILIKE $${paramIndex}`;
                case 'in':
                    if (Array.isArray(condition.value)) {
                        const inParams = condition.value.map((val, index) => {
                            params.push(val);
                            return `$${params.length}`;
                        });
                        params.splice(-1, 1); // Remove the array we just added
                        return `${condition.field} IN (${inParams.join(', ')})`;
                    }
                    return `${condition.field} = $${paramIndex}`;
                default:
                    return `${condition.field} = $${paramIndex}`;
            }
        }

        return '';
    }

    // Helper method to resolve relationships
    async resolveRelationships(record, relationships = []) {
        if (!record || !Array.isArray(relationships)) return record;

        const resolvedRecord = { ...record };

        for (const rel of relationships) {
            try {
                if (rel.type === 'hasMany') {
                    const query = `SELECT * FROM ${rel.table} WHERE ${rel.foreignKey} = $1`;
                    const result = await pool.query(query, [record[rel.localKey]]);
                    resolvedRecord[rel.as] = result.rows;
                } else if (rel.type === 'belongsTo') {
                    const query = `SELECT * FROM ${rel.table} WHERE ${rel.primaryKey} = $1`;
                    const result = await pool.query(query, [record[rel.foreignKey]]);
                    resolvedRecord[rel.as] = result.rows[0] || null;
                } else if (rel.type === 'manyToMany') {
                    const query = `
                        SELECT t.* FROM ${rel.table} t
                        JOIN ${rel.junction} j ON t.${rel.targetKey} = j.${rel.targetKey}
                        WHERE j.${rel.sourceKey} = $1
                    `;
                    const result = await pool.query(query, [record[rel.localKey]]);
                    resolvedRecord[rel.as] = result.rows;
                }
            } catch (error) {
                console.error(`Error resolving relationship ${rel.as}:`, error);
                resolvedRecord[rel.as] = rel.type === 'hasMany' || rel.type === 'manyToMany' ? [] : null;
            }
        }

        return resolvedRecord;
    }
}

module.exports = BaseModel;
