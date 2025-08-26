// backend/controllers/chainsControllerNew.js
const ChainModel = require('../models/ChainModel');
const chainModel = new ChainModel();

// Get all chains with advanced search
exports.getAllChains = async (req, res) => {
    try {
        const { page = 1, limit = 10, ...filters } = req.query;
        
        const searchArg = {};
        
        if (filters.sequenceContains) {
            searchArg.sequenceContains = filters.sequenceContains;
        }
        if (filters.minLength) {
            searchArg.minLength = parseInt(filters.minLength);
        }
        if (filters.maxLength) {
            searchArg.maxLength = parseInt(filters.maxLength);
        }
        if (filters.chainType) {
            searchArg.chainType = filters.chainType;
        }
        if (filters.organism) {
            searchArg.organism = filters.organism;
        }

        const pagination = { page: parseInt(page), limit: parseInt(limit) };
        const sort = { field: filters.sort_field || 'sequence_length', direction: filters.sort_dir || 'DESC' };

        const result = await chainModel.searchWithSequenceAnalysis(searchArg, pagination, sort);
        res.json(result);
    } catch (error) {
        console.error('Error fetching chains:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};

// Get chains for a specific entry
exports.getChainsByEntry = async (req, res) => {
    try {
        const { pdb_id } = req.params;
        const chains = await chainModel.getChainsByEntry(pdb_id);
        res.json(chains);
    } catch (error) {
        console.error('Error fetching chains for entry:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};

// Get a single chain by ID
exports.getChainById = async (req, res) => {
    try {
        const { id } = req.params;
        const chain = await chainModel.readOne(id);
        
        if (!chain) {
            return res.status(404).json({ message: 'Chain not found' });
        }
        
        res.json(chain);
    } catch (error) {
        console.error('Error fetching chain:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};

// Create a new chain
exports.createChain = async (req, res) => {
    try {
        const chain = await chainModel.create(req.body);
        res.status(201).json(chain);
    } catch (error) {
        console.error('Error creating chain:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};

// Update an existing chain
exports.updateChain = async (req, res) => {
    try {
        const { id } = req.params;
        const chain = await chainModel.update(id, req.body);
        
        if (!chain) {
            return res.status(404).json({ message: 'Chain not found' });
        }
        
        res.json(chain);
    } catch (error) {
        console.error('Error updating chain:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};

// Delete a chain
exports.deleteChain = async (req, res) => {
    try {
        const { id } = req.params;
        const chain = await chainModel.delete(id);
        
        if (!chain) {
            return res.status(404).json({ message: 'Chain not found' });
        }
        
        res.json({ message: 'Chain deleted successfully', chain });
    } catch (error) {
        console.error('Error deleting chain:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};

// Get amino acid composition for a chain
exports.getAminoAcidComposition = async (req, res) => {
    try {
        const { id } = req.params;
        const composition = await chainModel.getAminoAcidComposition(id);
        
        if (!composition) {
            return res.status(404).json({ message: 'Chain not found or no sequence available' });
        }
        
        res.json(composition);
    } catch (error) {
        console.error('Error getting amino acid composition:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};

// Get chain statistics
exports.getStatistics = async (req, res) => {
    try {
        const statistics = await chainModel.getChainStatistics();
        res.json(statistics);
    } catch (error) {
        console.error('Error fetching chain statistics:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};

// Find similar chains
exports.findSimilarChains = async (req, res) => {
    try {
        const { id } = req.params;
        const { threshold = 0.7 } = req.query;
        
        const similarChains = await chainModel.findSimilarChains(id, parseFloat(threshold));
        res.json(similarChains);
    } catch (error) {
        console.error('Error finding similar chains:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};

// Update chain organism
exports.updateChainOrganism = async (req, res) => {
    try {
        const { id } = req.params;
        const { organism_id } = req.body;
        
        const result = await chainModel.updateChainOrganism(id, organism_id);
        res.json(result);
    } catch (error) {
        console.error('Error updating chain organism:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};
