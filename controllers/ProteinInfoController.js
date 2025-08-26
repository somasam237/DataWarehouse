// backend/controllers/ProteinInfoController.js
const ProteinInfoModel = require('../models/ProteinInfoModel');

class ProteinInfoController {
    constructor() {
        this.proteinInfoModel = new ProteinInfoModel();
    }

    // GET /api/protein-info
    async getAllProteins(req, res) {
        try {
            const { limit = 50, offset = 0, sortBy = 'pdb_id', sortOrder = 'ASC' } = req.query;
            
            const proteins = await this.proteinInfoModel.readAll({
                limit: parseInt(limit),
                offset: parseInt(offset),
                sortBy,
                sortOrder
            });

            res.json(proteins);
        } catch (error) {
            console.error('Error fetching proteins:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // GET /api/protein-info/:pdb_id
    async getProteinById(req, res) {
        try {
            const { pdb_id } = req.params;
            const protein = await this.proteinInfoModel.readOne(pdb_id);
            
            if (!protein) {
                return res.status(404).json({ error: 'Protein not found' });
            }

            res.json(protein);
        } catch (error) {
            console.error('Error fetching protein:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // POST /api/protein-info/search
    async searchProteins(req, res) {
        try {
            const { query, limit = 50, offset = 0 } = req.body;
            
            const results = await this.proteinInfoModel.search(query, {
                limit: parseInt(limit),
                offset: parseInt(offset)
            });

            res.json(results);
        } catch (error) {
            console.error('Error searching proteins:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // GET /api/protein-info/search (for GET requests)
    async searchProteinsGet(req, res) {
        try {
            const { query, limit = 50, offset = 0 } = req.query;
            
            const results = await this.proteinInfoModel.search(query, {
                limit: parseInt(limit),
                offset: parseInt(offset)
            });

            res.json(results);
        } catch (error) {
            console.error('Error searching proteins:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // POST /api/protein-info/advanced-search
    async advancedSearch(req, res) {
        try {
            const { criteria, limit = 50, offset = 0 } = req.body;
            
            const results = await this.proteinInfoModel.advancedSearch(criteria, {
                limit: parseInt(limit),
                offset: parseInt(offset)
            });

            res.json(results);
        } catch (error) {
            console.error('Error in advanced search:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // GET /api/protein-info/statistics
    async getStatistics(req, res) {
        try {
            const statistics = await this.proteinInfoModel.getStatistics();
            res.json(statistics);
        } catch (error) {
            console.error('Error fetching protein statistics:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // GET /api/protein-info/by-classification/:classification
    async getByClassification(req, res) {
        try {
            const { classification } = req.params;
            const { limit = 50, offset = 0 } = req.query;
            
            const proteins = await this.proteinInfoModel.getByClassification(classification, {
                limit: parseInt(limit),
                offset: parseInt(offset)
            });

            res.json(proteins);
        } catch (error) {
            console.error('Error fetching proteins by classification:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // GET /api/protein-info/by-organism/:organism
    async getByOrganism(req, res) {
        try {
            const { organism } = req.params;
            const { limit = 50, offset = 0 } = req.query;
            
            const proteins = await this.proteinInfoModel.getByOrganism(organism, {
                limit: parseInt(limit),
                offset: parseInt(offset)
            });

            res.json(proteins);
        } catch (error) {
            console.error('Error fetching proteins by organism:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // GET /api/protein-info/by-molecular-weight
    async getByMolecularWeightRange(req, res) {
        try {
            const { min_weight, max_weight, limit = 50, offset = 0 } = req.query;
            
            if (!min_weight || !max_weight) {
                return res.status(400).json({ error: 'Both min_weight and max_weight are required' });
            }

            const proteins = await this.proteinInfoModel.getByMolecularWeightRange(
                parseFloat(min_weight),
                parseFloat(max_weight),
                {
                    limit: parseInt(limit),
                    offset: parseInt(offset)
                }
            );

            res.json(proteins);
        } catch (error) {
            console.error('Error fetching proteins by molecular weight:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // GET /api/protein-info/by-date-range
    async getByDateRange(req, res) {
        try {
            const { start_date, end_date, limit = 50, offset = 0 } = req.query;
            
            if (!start_date || !end_date) {
                return res.status(400).json({ error: 'Both start_date and end_date are required' });
            }

            const proteins = await this.proteinInfoModel.getByDateRange(start_date, end_date, {
                limit: parseInt(limit),
                offset: parseInt(offset)
            });

            res.json(proteins);
        } catch (error) {
            console.error('Error fetching proteins by date range:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // GET /api/protein-info/classification-distribution
    async getClassificationDistribution(req, res) {
        try {
            const distribution = await this.proteinInfoModel.getClassificationDistribution();
            res.json(distribution);
        } catch (error) {
            console.error('Error fetching classification distribution:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // GET /api/protein-info/organism-distribution
    async getOrganismDistribution(req, res) {
        try {
            const distribution = await this.proteinInfoModel.getOrganismDistribution();
            res.json(distribution);
        } catch (error) {
            console.error('Error fetching organism distribution:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // GET /api/protein-info/molecular-weight-distribution
    async getMolecularWeightDistribution(req, res) {
        try {
            const distribution = await this.proteinInfoModel.getMolecularWeightDistribution();
            res.json(distribution);
        } catch (error) {
            console.error('Error fetching molecular weight distribution:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // POST /api/protein-info
    async createProtein(req, res) {
        try {
            const proteinData = req.body;
            const newProtein = await this.proteinInfoModel.create(proteinData);
            res.status(201).json(newProtein);
        } catch (error) {
            console.error('Error creating protein:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // PUT /api/protein-info/:pdb_id
    async updateProtein(req, res) {
        try {
            const { pdb_id } = req.params;
            const updates = req.body;
            
            const updatedProtein = await this.proteinInfoModel.update(pdb_id, updates);
            
            if (!updatedProtein) {
                return res.status(404).json({ error: 'Protein not found' });
            }

            res.json(updatedProtein);
        } catch (error) {
            console.error('Error updating protein:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // DELETE /api/protein-info/:pdb_id
    async deleteProtein(req, res) {
        try {
            const { pdb_id } = req.params;
            const success = await this.proteinInfoModel.delete(pdb_id);
            
            if (!success) {
                return res.status(404).json({ error: 'Protein not found' });
            }

            res.json({ message: 'Protein deleted successfully' });
        } catch (error) {
            console.error('Error deleting protein:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}

module.exports = ProteinInfoController;
