// backend/controllers/entriesController.js
const EntryModel = require('../models/EntryModel');
const entryModel = new EntryModel();

// Get all entries with advanced search and pagination
exports.getAllEntries = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '', ...filters } = req.query;
        
        // Build search argument tree
        const searchArg = {};
        
        if (search) {
            searchArg.text = search;
        }

        // Add filters
        if (filters.experimental_method) {
            searchArg.experimental_method = filters.experimental_method;
        }
        if (filters.resolution_min) {
            searchArg.resolution_min = parseFloat(filters.resolution_min);
        }
        if (filters.resolution_max) {
            searchArg.resolution_max = parseFloat(filters.resolution_max);
        }
        if (filters.year_from) {
            searchArg.year_from = parseInt(filters.year_from);
        }
        if (filters.year_to) {
            searchArg.year_to = parseInt(filters.year_to);
        }

        const pagination = { page: parseInt(page), limit: parseInt(limit) };
        const sort = { field: filters.sort_field || 'deposition_date', direction: filters.sort_dir || 'DESC' };

        const result = await entryModel.search(searchArg, pagination, sort);
        res.json(result);
    } catch (error) {
        console.error('Error fetching entries:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};

// Get a single entry by ID with relationships
exports.getEntryById = async (req, res) => {
    try {
        const { id } = req.params;
        const entry = await entryModel.readOneWithRelationships(id);
        
        if (!entry) {
            return res.status(404).json({ message: 'Entry not found' });
        }
        
        res.json(entry);
    } catch (error) {
        console.error('Error fetching entry:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};

// Create a new entry
exports.createEntry = async (req, res) => {
    try {
        const entry = await entryModel.create(req.body);
        res.status(201).json(entry);
    } catch (error) {
        console.error('Error creating entry:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};

// Update an existing entry
exports.updateEntry = async (req, res) => {
    try {
        const { id } = req.params;
        const entry = await entryModel.update(id, req.body);
        
        if (!entry) {
            return res.status(404).json({ message: 'Entry not found' });
        }
        
        res.json(entry);
    } catch (error) {
        console.error('Error updating entry:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};

// Delete an entry
exports.deleteEntry = async (req, res) => {
    try {
        const { id } = req.params;
        const entry = await entryModel.delete(id);
        
        if (!entry) {
            return res.status(404).json({ message: 'Entry not found' });
        }
        
        res.json({ message: 'Entry deleted successfully', entry });
    } catch (error) {
        console.error('Error deleting entry:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};

// Get entries summary
exports.getEntriesSummary = async (req, res) => {
    try {
        const summary = await entryModel.getEntriesSummary();
        res.json(summary);
    } catch (error) {
        console.error('Error fetching entries summary:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};

// Get statistics for plotting
exports.getStatistics = async (req, res) => {
    try {
        const statistics = await entryModel.getStatistics();
        res.json(statistics);
    } catch (error) {
        console.error('Error fetching statistics:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};

// Add entry to favorites
exports.addToFavorites = async (req, res) => {
    try {
        const { id } = req.params;
        const { user_id } = req.body;
        
        const favorite = await entryModel.addToFavorites(id, user_id);
        res.json(favorite);
    } catch (error) {
        console.error('Error adding to favorites:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};

// Remove entry from favorites
exports.removeFromFavorites = async (req, res) => {
    try {
        const { id } = req.params;
        const { user_id } = req.body;
        
        const favorite = await entryModel.removeFromFavorites(id, user_id);
        res.json(favorite);
    } catch (error) {
        console.error('Error removing from favorites:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};

// Get user favorites
exports.getUserFavorites = async (req, res) => {
    try {
        const { user_id } = req.params;
        const favorites = await entryModel.getUserFavorites(user_id);
        res.json(favorites);
    } catch (error) {
        console.error('Error fetching user favorites:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};
