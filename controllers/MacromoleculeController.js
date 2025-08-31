// backend/controllers/MacromoleculeController.js
const MacromoleculeModel = require('../models/MacromoleculeModel');

class MacromoleculeController {
    constructor() {
        this.macromoleculeModel = new MacromoleculeModel();
    }

    // GET /api/macromolecules
    async getAllMacromolecules(req, res) {
        try {
            const { limit = 50, offset = 0, sortBy = 'pdb_id', sortOrder = 'ASC' } = req.query;
            
            const records = await this.macromoleculeModel.readAll({
                limit: parseInt(limit),
                offset: parseInt(offset),
                sortBy,
                sortOrder
            });

            res.json(records);
        } catch (error) {
            console.error('Error fetching macromolecules:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // GET /api/macromolecules/:id
    async getMacromoleculeById(req, res) {
        try {
            const { id } = req.params;
            const record = await this.macromoleculeModel.readOne(id);
            
            if (!record) {
                return res.status(404).json({ error: 'Macromolecule not found' });
            }

            res.json(record);
        } catch (error) {
            console.error('Error fetching macromolecule:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // GET /api/macromolecules/by-pdb/:pdb_id
    async getByPdbId(req, res) {
        try {
            const { pdb_id } = req.params;
            const records = await this.macromoleculeModel.getByPdbId(pdb_id);
            res.json(records);
        } catch (error) {
            console.error('Error fetching macromolecules by PDB ID:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // GET /api/macromolecules/by-pdb-entity/:pdb_id/:entity_id
    async getByPdbIdAndEntity(req, res) {
        try {
            const { pdb_id, entity_id } = req.params;
            const record = await this.macromoleculeModel.getByPdbIdAndEntity(pdb_id, parseInt(entity_id));
            
            if (!record) {
                return res.status(404).json({ error: 'Macromolecule not found' });
            }

            res.json(record);
        } catch (error) {
            console.error('Error fetching macromolecule by PDB ID and entity:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // GET /api/macromolecules/search/molecule-name
    async searchByMoleculeName(req, res) {
        try {
            const { molecule_name, limit = 50, offset = 0 } = req.query;
            
            if (!molecule_name) {
                return res.status(400).json({ error: 'molecule_name parameter is required' });
            }

            const results = await this.macromoleculeModel.searchByMoleculeName(molecule_name, {
                limit: parseInt(limit),
                offset: parseInt(offset)
            });

            res.json(results);
        } catch (error) {
            console.error('Error searching by molecule name:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // GET /api/macromolecules/by-sequence-length
    async getBySequenceLengthRange(req, res) {
        try {
            const { min_length, max_length, limit = 50, offset = 0 } = req.query;
            
            if (!min_length || !max_length) {
                return res.status(400).json({ error: 'Both min_length and max_length are required' });
            }

            const records = await this.macromoleculeModel.getBySequenceLengthRange(
                parseInt(min_length),
                parseInt(max_length),
                {
                    limit: parseInt(limit),
                    offset: parseInt(offset)
                }
            );

            res.json(records);
        } catch (error) {
            console.error('Error fetching macromolecules by sequence length:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // GET /api/macromolecules/statistics
    async getMacromoleculeStatistics(req, res) {
        try {
            const statistics = await this.macromoleculeModel.getMacromoleculeStatistics();
            res.json(statistics);
        } catch (error) {
            console.error('Error fetching macromolecule statistics:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // GET /api/macromolecules/count
    async getCount(req, res) {
        try {
            const count = await this.macromoleculeModel.getCount();
            res.json({ count });
        } catch (error) {
            console.error('Error fetching macromolecule count:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // GET /api/macromolecules/search
    async searchMacromolecules(req, res) {
        try {
            const { search, limit = 50, offset = 0 } = req.query;
            
            if (!search) {
                return res.status(400).json({ error: 'Search term is required' });
            }
            
            const results = await this.macromoleculeModel.search(search, {
                limit: parseInt(limit),
                offset: parseInt(offset)
            });

            res.json(results);
        } catch (error) {
            console.error('Error searching macromolecules:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // GET /api/macromolecules/pdb/:pdb_id
    async getByPdbId(req, res) {
        try {
            const { pdb_id } = req.params;
            const records = await this.macromoleculeModel.getByPdbId(pdb_id);
            res.json(records);
        } catch (error) {
            console.error('Error fetching macromolecules by PDB ID:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // GET /api/macromolecules/sequence-length-distribution
    async getSequenceLengthDistribution(req, res) {
        try {
            const distribution = await this.macromoleculeModel.getSequenceLengthDistribution();
            res.json(distribution);
        } catch (error) {
            console.error('Error fetching sequence length distribution:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // GET /api/macromolecules/top-molecule-names
    async getTopMoleculeNames(req, res) {
        try {
            const { limit = 20 } = req.query;
            
            const moleculeNames = await this.macromoleculeModel.getTopMoleculeNames({
                limit: parseInt(limit)
            });

            res.json(moleculeNames);
        } catch (error) {
            console.error('Error fetching top molecule names:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // GET /api/macromolecules/chain-composition
    async getChainComposition(req, res) {
        try {
            const { limit = 50, offset = 0 } = req.query;
            
            const composition = await this.macromoleculeModel.getChainComposition({
                limit: parseInt(limit),
                offset: parseInt(offset)
            });

            res.json(composition);
        } catch (error) {
            console.error('Error fetching chain composition:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // GET /api/macromolecules/multi-entity-proteins
    async getMultiEntityProteins(req, res) {
        try {
            const { limit = 50, offset = 0 } = req.query;
            
            const proteins = await this.macromoleculeModel.getMultiEntityProteins({
                limit: parseInt(limit),
                offset: parseInt(offset)
            });

            res.json(proteins);
        } catch (error) {
            console.error('Error fetching multi-entity proteins:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // POST /api/macromolecules/advanced-search
    async advancedSearch(req, res) {
        try {
            const { criteria, limit = 50, offset = 0 } = req.body;
            
            const results = await this.macromoleculeModel.advancedSearch(criteria, {
                limit: parseInt(limit),
                offset: parseInt(offset)
            });

            res.json(results);
        } catch (error) {
            console.error('Error in advanced search:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // POST /api/macromolecules
    async createMacromolecule(req, res) {
        try {
            const recordData = req.body;
            
            // Validate required fields
            if (!recordData || !recordData.pdb_id) {
                return res.status(400).json({ error: 'PDB ID is required' });
            }
            
            const newRecord = await this.macromoleculeModel.create(recordData);
            res.status(201).json(newRecord);
        } catch (error) {
            console.error('Error creating macromolecule:', error);
            res.status(500).json({ error: 'Internal server error', details: error.message });
        }
    }

    // PUT /api/macromolecules/:id
    async updateMacromolecule(req, res) {
        try {
            const { id } = req.params;
            const updates = req.body;
            
            const updatedRecord = await this.macromoleculeModel.update(id, updates);
            
            if (!updatedRecord) {
                return res.status(404).json({ error: 'Macromolecule not found' });
            }

            res.json(updatedRecord);
        } catch (error) {
            console.error('Error updating macromolecule:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // DELETE /api/macromolecules/:id
    async deleteMacromolecule(req, res) {
        try {
            const { id } = req.params;
            const success = await this.macromoleculeModel.delete(id);
            
            if (!success) {
                return res.status(404).json({ error: 'Macromolecule not found' });
            }

            res.json({ message: 'Macromolecule deleted successfully' });
        } catch (error) {
            console.error('Error deleting macromolecule:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}

module.exports = MacromoleculeController;
