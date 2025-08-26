// backend/controllers/LigandsNewController.js
const LigandsModel = require('../models/LigandsModel');

class LigandsNewController {
    constructor() {
        this.ligandsModel = new LigandsModel();
    }

    // GET /api/ligands-new
    async getAllLigands(req, res) {
        try {
            const { limit = 50, offset = 0, sortBy = 'pdb_id', sortOrder = 'ASC' } = req.query;
            
            const records = await this.ligandsModel.readAll({
                limit: parseInt(limit),
                offset: parseInt(offset),
                sortBy,
                sortOrder
            });

            res.json(records);
        } catch (error) {
            console.error('Error fetching ligands:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // GET /api/ligands-new/:id
    async getLigandById(req, res) {
        try {
            const { id } = req.params;
            const record = await this.ligandsModel.readOne(id);
            
            if (!record) {
                return res.status(404).json({ error: 'Ligand not found' });
            }

            res.json(record);
        } catch (error) {
            console.error('Error fetching ligand:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // GET /api/ligands-new/by-pdb/:pdb_id
    async getByPdbId(req, res) {
        try {
            const { pdb_id } = req.params;
            const records = await this.ligandsModel.getByPdbId(pdb_id);
            res.json(records);
        } catch (error) {
            console.error('Error fetching ligands by PDB ID:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // GET /api/ligands-new/by-pdb-ligand/:pdb_id/:ligand_id
    async getByPdbIdAndLigandId(req, res) {
        try {
            const { pdb_id, ligand_id } = req.params;
            const record = await this.ligandsModel.getByPdbIdAndLigandId(pdb_id, ligand_id);
            
            if (!record) {
                return res.status(404).json({ error: 'Ligand not found' });
            }

            res.json(record);
        } catch (error) {
            console.error('Error fetching ligand by PDB ID and ligand ID:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // GET /api/ligands-new/search/ligand-name
    async searchByLigandName(req, res) {
        try {
            const { ligand_name, limit = 50, offset = 0 } = req.query;
            
            if (!ligand_name) {
                return res.status(400).json({ error: 'ligand_name parameter is required' });
            }

            const results = await this.ligandsModel.searchByLigandName(ligand_name, {
                limit: parseInt(limit),
                offset: parseInt(offset)
            });

            res.json(results);
        } catch (error) {
            console.error('Error searching by ligand name:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // GET /api/ligands-new/search/chemical-formula
    async searchByChemicalFormula(req, res) {
        try {
            const { formula, limit = 50, offset = 0 } = req.query;
            
            if (!formula) {
                return res.status(400).json({ error: 'formula parameter is required' });
            }

            const results = await this.ligandsModel.searchByChemicalFormula(formula, {
                limit: parseInt(limit),
                offset: parseInt(offset)
            });

            res.json(results);
        } catch (error) {
            console.error('Error searching by chemical formula:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // GET /api/ligands-new/search/inchi-key
    async searchByInchiKey(req, res) {
        try {
            const { inchi_key, limit = 50, offset = 0 } = req.query;
            
            if (!inchi_key) {
                return res.status(400).json({ error: 'inchi_key parameter is required' });
            }

            const results = await this.ligandsModel.searchByInchiKey(inchi_key, {
                limit: parseInt(limit),
                offset: parseInt(offset)
            });

            res.json(results);
        } catch (error) {
            console.error('Error searching by InChI key:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // GET /api/ligands-new/search/bound-chains
    async searchByBoundChains(req, res) {
        try {
            const { chain_id, limit = 50, offset = 0 } = req.query;
            
            if (!chain_id) {
                return res.status(400).json({ error: 'chain_id parameter is required' });
            }

            const results = await this.ligandsModel.searchByBoundChains(chain_id, {
                limit: parseInt(limit),
                offset: parseInt(offset)
            });

            res.json(results);
        } catch (error) {
            console.error('Error searching by bound chains:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // GET /api/ligands-new/statistics
    async getLigandStatistics(req, res) {
        try {
            const statistics = await this.ligandsModel.getLigandStatistics();
            res.json(statistics);
        } catch (error) {
            console.error('Error fetching ligand statistics:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // GET /api/ligands-new/top-ligands
    async getTopLigands(req, res) {
        try {
            const { limit = 20 } = req.query;
            
            const ligands = await this.ligandsModel.getTopLigands({
                limit: parseInt(limit)
            });

            res.json(ligands);
        } catch (error) {
            console.error('Error fetching top ligands:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // GET /api/ligands-new/top-chemical-formulas
    async getTopChemicalFormulas(req, res) {
        try {
            const { limit = 20 } = req.query;
            
            const formulas = await this.ligandsModel.getTopChemicalFormulas({
                limit: parseInt(limit)
            });

            res.json(formulas);
        } catch (error) {
            console.error('Error fetching top chemical formulas:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // GET /api/ligands-new/chain-binding-patterns
    async getChainBindingPatterns(req, res) {
        try {
            const { limit = 50 } = req.query;
            
            const patterns = await this.ligandsModel.getChainBindingPatterns({
                limit: parseInt(limit)
            });

            res.json(patterns);
        } catch (error) {
            console.error('Error fetching chain binding patterns:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // GET /api/ligands-new/proteins-with-multiple-ligands
    async getProteinsWithMultipleLigands(req, res) {
        try {
            const { limit = 50, offset = 0 } = req.query;
            
            const proteins = await this.ligandsModel.getProteinsWithMultipleLigands({
                limit: parseInt(limit),
                offset: parseInt(offset)
            });

            res.json(proteins);
        } catch (error) {
            console.error('Error fetching proteins with multiple ligands:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // GET /api/ligands-new/ligand-protein-network
    async getLigandProteinNetwork(req, res) {
        try {
            const { limit = 100 } = req.query;
            
            const network = await this.ligandsModel.getLigandProteinNetwork({
                limit: parseInt(limit)
            });

            res.json(network);
        } catch (error) {
            console.error('Error fetching ligand-protein network:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // POST /api/ligands-new/advanced-search
    async advancedSearch(req, res) {
        try {
            const { criteria, limit = 50, offset = 0 } = req.body;
            
            const results = await this.ligandsModel.advancedSearch(criteria, {
                limit: parseInt(limit),
                offset: parseInt(offset)
            });

            res.json(results);
        } catch (error) {
            console.error('Error in advanced search:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // POST /api/ligands-new
    async createLigand(req, res) {
        try {
            const recordData = req.body;
            const newRecord = await this.ligandsModel.create(recordData);
            res.status(201).json(newRecord);
        } catch (error) {
            console.error('Error creating ligand:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // PUT /api/ligands-new/:id
    async updateLigand(req, res) {
        try {
            const { id } = req.params;
            const updates = req.body;
            
            const updatedRecord = await this.ligandsModel.update(id, updates);
            
            if (!updatedRecord) {
                return res.status(404).json({ error: 'Ligand not found' });
            }

            res.json(updatedRecord);
        } catch (error) {
            console.error('Error updating ligand:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // DELETE /api/ligands-new/:id
    async deleteLigand(req, res) {
        try {
            const { id } = req.params;
            const success = await this.ligandsModel.delete(id);
            
            if (!success) {
                return res.status(404).json({ error: 'Ligand not found' });
            }

            res.json({ message: 'Ligand deleted successfully' });
        } catch (error) {
            console.error('Error deleting ligand:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}

module.exports = LigandsNewController;
