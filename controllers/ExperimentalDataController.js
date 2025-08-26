// backend/controllers/ExperimentalDataController.js
const ExperimentalDataModel = require('../models/ExperimentalDataModel');

class ExperimentalDataController {
    constructor() {
        this.experimentalDataModel = new ExperimentalDataModel();
    }

    // GET /api/experimental-data
    async getAllExperimentalData(req, res) {
        try {
            const { limit = 50, offset = 0, sortBy = 'pdb_id', sortOrder = 'ASC' } = req.query;
            
            const records = await this.experimentalDataModel.readAll({
                limit: parseInt(limit),
                offset: parseInt(offset),
                sortBy,
                sortOrder
            });

            res.json(records);
        } catch (error) {
            console.error('Error fetching experimental data:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // GET /api/experimental-data/:id
    async getExperimentalDataById(req, res) {
        try {
            const { id } = req.params;
            const record = await this.experimentalDataModel.readOne(id);
            
            if (!record) {
                return res.status(404).json({ error: 'Experimental data not found' });
            }

            res.json(record);
        } catch (error) {
            console.error('Error fetching experimental data:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // GET /api/experimental-data/by-pdb/:pdb_id
    async getByPdbId(req, res) {
        try {
            const { pdb_id } = req.params;
            const records = await this.experimentalDataModel.getByPdbId(pdb_id);
            res.json(records);
        } catch (error) {
            console.error('Error fetching experimental data by PDB ID:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // GET /api/experimental-data/by-method/:method
    async getByMethod(req, res) {
        try {
            const { method } = req.params;
            const { limit = 50, offset = 0 } = req.query;
            
            const records = await this.experimentalDataModel.getByMethod(method, {
                limit: parseInt(limit),
                offset: parseInt(offset)
            });

            res.json(records);
        } catch (error) {
            console.error('Error fetching experimental data by method:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // GET /api/experimental-data/by-resolution
    async getByResolutionRange(req, res) {
        try {
            const { min_resolution, max_resolution, limit = 50, offset = 0 } = req.query;
            
            if (!min_resolution || !max_resolution) {
                return res.status(400).json({ error: 'Both min_resolution and max_resolution are required' });
            }

            const records = await this.experimentalDataModel.getByResolutionRange(
                parseFloat(min_resolution),
                parseFloat(max_resolution),
                {
                    limit: parseInt(limit),
                    offset: parseInt(offset)
                }
            );

            res.json(records);
        } catch (error) {
            console.error('Error fetching experimental data by resolution:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // GET /api/experimental-data/by-r-factor
    async getByRFactorRange(req, res) {
        try {
            const { min_r_factor, max_r_factor, limit = 50, offset = 0 } = req.query;
            
            if (!min_r_factor || !max_r_factor) {
                return res.status(400).json({ error: 'Both min_r_factor and max_r_factor are required' });
            }

            const records = await this.experimentalDataModel.getByRFactorRange(
                parseFloat(min_r_factor),
                parseFloat(max_r_factor),
                {
                    limit: parseInt(limit),
                    offset: parseInt(offset)
                }
            );

            res.json(records);
        } catch (error) {
            console.error('Error fetching experimental data by R-factor:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // GET /api/experimental-data/statistics
    async getExperimentalStatistics(req, res) {
        try {
            const statistics = await this.experimentalDataModel.getExperimentalStatistics();
            res.json(statistics);
        } catch (error) {
            console.error('Error fetching experimental statistics:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // GET /api/experimental-data/method-distribution
    async getMethodDistribution(req, res) {
        try {
            const distribution = await this.experimentalDataModel.getMethodDistribution();
            res.json(distribution);
        } catch (error) {
            console.error('Error fetching method distribution:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // GET /api/experimental-data/resolution-r-factor-correlation
    async getResolutionRFactorCorrelation(req, res) {
        try {
            const correlation = await this.experimentalDataModel.getResolutionRFactorCorrelation();
            res.json(correlation);
        } catch (error) {
            console.error('Error fetching resolution vs R-factor correlation:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // GET /api/experimental-data/quality-metrics-by-method
    async getQualityMetricsByMethod(req, res) {
        try {
            const metrics = await this.experimentalDataModel.getQualityMetricsByMethod();
            res.json(metrics);
        } catch (error) {
            console.error('Error fetching quality metrics by method:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // POST /api/experimental-data/advanced-search
    async advancedSearch(req, res) {
        try {
            const { criteria, limit = 50, offset = 0 } = req.body;
            
            const results = await this.experimentalDataModel.advancedSearch(criteria, {
                limit: parseInt(limit),
                offset: parseInt(offset)
            });

            res.json(results);
        } catch (error) {
            console.error('Error in advanced search:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // POST /api/experimental-data
    async createExperimentalData(req, res) {
        try {
            const recordData = req.body;
            const newRecord = await this.experimentalDataModel.create(recordData);
            res.status(201).json(newRecord);
        } catch (error) {
            console.error('Error creating experimental data:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // PUT /api/experimental-data/:id
    async updateExperimentalData(req, res) {
        try {
            const { id } = req.params;
            const updates = req.body;
            
            const updatedRecord = await this.experimentalDataModel.update(id, updates);
            
            if (!updatedRecord) {
                return res.status(404).json({ error: 'Experimental data not found' });
            }

            res.json(updatedRecord);
        } catch (error) {
            console.error('Error updating experimental data:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // DELETE /api/experimental-data/:id
    async deleteExperimentalData(req, res) {
        try {
            const { id } = req.params;
            const success = await this.experimentalDataModel.delete(id);
            
            if (!success) {
                return res.status(404).json({ error: 'Experimental data not found' });
            }

            res.json({ message: 'Experimental data deleted successfully' });
        } catch (error) {
            console.error('Error deleting experimental data:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}

module.exports = ExperimentalDataController;
