// backend/controllers/ligandsControllerNew.js
const LigandModel = require('../models/LigandModel');

class LigandsController {
    constructor() {
        this.ligandModel = new LigandModel();
    }

    // GET /api/ligands
    async getAllLigands(req, res) {
        try {
            const { limit = 50, offset = 0, sortBy = 'ligand_name', sortOrder = 'ASC' } = req.query;
            
            const ligands = await this.ligandModel.readAll({
                limit: parseInt(limit),
                offset: parseInt(offset),
                sortBy,
                sortOrder
            });

            res.json(ligands);
        } catch (error) {
            console.error('Error fetching ligands:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // GET /api/ligands/:id
    async getLigandById(req, res) {
        try {
            const { id } = req.params;
            const ligand = await this.ligandModel.readOne(id);
            
            if (!ligand) {
                return res.status(404).json({ error: 'Ligand not found' });
            }

            res.json(ligand);
        } catch (error) {
            console.error('Error fetching ligand:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // POST /api/ligands/search
    async searchLigands(req, res) {
        try {
            const { query, limit = 50, offset = 0 } = req.body;
            
            const results = await this.ligandModel.search(query, {
                limit: parseInt(limit),
                offset: parseInt(offset)
            });

            res.json(results);
        } catch (error) {
            console.error('Error searching ligands:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // GET /api/ligands/search (for GET requests)
    async searchLigandsGet(req, res) {
        try {
            const { query, limit = 50, offset = 0 } = req.query;
            
            const results = await this.ligandModel.search(query, {
                limit: parseInt(limit),
                offset: parseInt(offset)
            });

            res.json(results);
        } catch (error) {
            console.error('Error searching ligands:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // POST /api/ligands/search/chemical
    async searchWithChemicalProperties(req, res) {
        try {
            const { 
                molecularWeight, 
                formula, 
                smiles, 
                limit = 50, 
                offset = 0 
            } = req.body;
            
            const results = await this.ligandModel.searchWithChemicalProperties({
                molecularWeight,
                formula,
                smiles,
                limit: parseInt(limit),
                offset: parseInt(offset)
            });

            res.json(results);
        } catch (error) {
            console.error('Error searching ligands with chemical properties:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // GET /api/ligands/:id/cooccurrences
    async getLigandCooccurrences(req, res) {
        try {
            const { id } = req.params;
            const { limit = 20 } = req.query;
            
            const cooccurrences = await this.ligandModel.findLigandCooccurrences(id, {
                limit: parseInt(limit)
            });

            res.json(cooccurrences);
        } catch (error) {
            console.error('Error fetching ligand cooccurrences:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // POST /api/ligands
    async createLigand(req, res) {
        try {
            const ligandData = req.body;
            const newLigand = await this.ligandModel.create(ligandData);
            res.status(201).json(newLigand);
        } catch (error) {
            console.error('Error creating ligand:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // PUT /api/ligands/:id
    async updateLigand(req, res) {
        try {
            const { id } = req.params;
            const updates = req.body;
            
            const updatedLigand = await this.ligandModel.update(id, updates);
            
            if (!updatedLigand) {
                return res.status(404).json({ error: 'Ligand not found' });
            }

            res.json(updatedLigand);
        } catch (error) {
            console.error('Error updating ligand:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // DELETE /api/ligands/:id
    async deleteLigand(req, res) {
        try {
            const { id } = req.params;
            const success = await this.ligandModel.delete(id);
            
            if (!success) {
                return res.status(404).json({ error: 'Ligand not found' });
            }

            res.json({ message: 'Ligand deleted successfully' });
        } catch (error) {
            console.error('Error deleting ligand:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // GET /api/ligands/statistics
    async getLigandStatistics(req, res) {
        try {
            const statistics = await this.ligandModel.getStatistics();
            res.json(statistics);
        } catch (error) {
            console.error('Error fetching ligand statistics:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // GET /api/ligands/types
    async getLigandTypes(req, res) {
        try {
            const types = await this.ligandModel.getLigandTypes();
            res.json(types);
        } catch (error) {
            console.error('Error fetching ligand types:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // GET /api/ligands/by-molecular-weight
    async getLigandsByMolecularWeight(req, res) {
        try {
            const { minWeight, maxWeight, limit = 50 } = req.query;
            
            const ligands = await this.ligandModel.getLigandsByMolecularWeight({
                minWeight: parseFloat(minWeight),
                maxWeight: parseFloat(maxWeight),
                limit: parseInt(limit)
            });

            res.json(ligands);
        } catch (error) {
            console.error('Error fetching ligands by molecular weight:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // GET /api/ligands/by-formula/:formula
    async getLigandsByFormula(req, res) {
        try {
            const { formula } = req.params;
            const { limit = 50 } = req.query;
            
            const ligands = await this.ligandModel.getLigandsByFormula(formula, {
                limit: parseInt(limit)
            });

            res.json(ligands);
        } catch (error) {
            console.error('Error fetching ligands by formula:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}

module.exports = LigandsController;
