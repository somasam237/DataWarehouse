// backend/controllers/entriesController.js
const pool = require('../db');

// Get all entries with search and pagination
exports.getAllEntries = async (req, res) => {
    const { page = 1, limit = 10, search = '' } = req.query;
    const offset = (page - 1) * limit;

    try {
        let selectQuery = 'SELECT pdb_id, title, deposition_date, experimental_method, resolution, r_factor FROM entries';
        let countQuery = 'SELECT COUNT(*) FROM entries';
        let params = [];
        let paramIndex = 1;

        if (search) {
            // Case-insensitive search on title and PDB ID
            selectQuery += ` WHERE title ILIKE $${paramIndex} OR pdb_id ILIKE $${paramIndex}`;
            countQuery += ` WHERE title ILIKE $${paramIndex} OR pdb_id ILIKE $${paramIndex}`;
            params.push(`%${search}%`);
            paramIndex++;
        }

        selectQuery += ` ORDER BY pdb_id ASC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(limit, offset);

        const entriesResult = await pool.query(selectQuery, params);
        // Count query params are just the search params, not limit/offset
        const countResult = await pool.query(countQuery, params.slice(0, params.length - 2));

        res.json({
            total: parseInt(countResult.rows[0].count),
            page: parseInt(page),
            limit: parseInt(limit),
            data: entriesResult.rows,
        });
    } catch (err) {
        console.error('Error fetching entries:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get a single entry by ID
exports.getEntryById = async (req, res) => {
    const { id } = req.params; // PDB_ID from URL parameter
    try {
        const result = await pool.query('SELECT * FROM entries WHERE pdb_id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Entry not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error fetching entry by ID:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Create a new entry
exports.createEntry = async (req, res) => {
    const { pdb_id, title, deposition_date, revision_date, experimental_method, resolution, r_factor, full_cif_data } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO entries (pdb_id, title, deposition_date, revision_date, experimental_method, resolution, r_factor, full_cif_data) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
            [pdb_id, title, deposition_date, revision_date, experimental_method, resolution, r_factor, full_cif_data]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error creating entry:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Update an existing entry
exports.updateEntry = async (req, res) => {
    const { id } = req.params;
    const { title, deposition_date, revision_date, experimental_method, resolution, r_factor, full_cif_data } = req.body;
    try {
        const result = await pool.query(
            'UPDATE entries SET title = $1, deposition_date = $2, revision_date = $3, experimental_method = $4, resolution = $5, r_factor = $6, full_cif_data = $7 WHERE pdb_id = $8 RETURNING *',
            [title, deposition_date, revision_date, experimental_method, resolution, r_factor, full_cif_data, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Entry not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating entry:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Delete an entry
exports.deleteEntry = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('DELETE FROM entries WHERE pdb_id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Entry not found' });
        }
        res.status(204).send(); // 204 No Content for successful deletion
    } catch (err) {
        console.error('Error deleting entry:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};