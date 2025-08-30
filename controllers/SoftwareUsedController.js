// backend/controllers/SoftwareUsedController.js
const SoftwareUsedModel = require('../models/SoftwareUsedModel');

class SoftwareUsedController {
    constructor() {
        this.softwareUsedModel = new SoftwareUsedModel();
    }

    // GET /api/software-used
    async getAllSoftware(req, res) {
        try {
            const { limit = 50, offset = 0, sortBy = 'pdb_id', sortOrder = 'ASC' } = req.query;
            
            const records = await this.softwareUsedModel.readAll({
                limit: parseInt(limit),
                offset: parseInt(offset),
                sortBy,
                sortOrder
            });

            res.json(records);
        } catch (error) {
            console.error('Error fetching software records:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // GET /api/software-used/:id
    async getSoftwareById(req, res) {
        try {
            const { id } = req.params;
            const record = await this.softwareUsedModel.readOne(id);
            
            if (!record) {
                return res.status(404).json({ error: 'Software record not found' });
            }

            res.json(record);
        } catch (error) {
            console.error('Error fetching software record:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // GET /api/software-used/by-pdb/:pdb_id
    async getByPdbId(req, res) {
        try {
            const { pdb_id } = req.params;
            const records = await this.softwareUsedModel.getByPdbId(pdb_id);
            res.json(records);
        } catch (error) {
            console.error('Error fetching software by PDB ID:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // GET /api/software-used/search/software-name
    async searchBySoftwareName(req, res) {
        try {
            const { software_name, limit = 50, offset = 0 } = req.query;
            
            if (!software_name) {
                return res.status(400).json({ error: 'software_name parameter is required' });
            }

            const results = await this.softwareUsedModel.searchBySoftwareName(software_name, {
                limit: parseInt(limit),
                offset: parseInt(offset)
            });

            res.json(results);
        } catch (error) {
            console.error('Error searching by software name:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // GET /api/software-used/search/classification
    async searchByClassification(req, res) {
        try {
            const { classification, limit = 50, offset = 0 } = req.query;
            
            if (!classification) {
                return res.status(400).json({ error: 'classification parameter is required' });
            }

            const results = await this.softwareUsedModel.searchByClassification(classification, {
                limit: parseInt(limit),
                offset: parseInt(offset)
            });

            res.json(results);
        } catch (error) {
            console.error('Error searching by classification:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // GET /api/software-used/search/version
    async searchByVersion(req, res) {
        try {
            const { version, limit = 50, offset = 0 } = req.query;
            
            if (!version) {
                return res.status(400).json({ error: 'version parameter is required' });
            }

            const results = await this.softwareUsedModel.searchByVersion(version, {
                limit: parseInt(limit),
                offset: parseInt(offset)
            });

            res.json(results);
        } catch (error) {
            console.error('Error searching by version:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // GET /api/software-used/statistics
    async getSoftwareStatistics(req, res) {
        try {
            const statistics = await this.softwareUsedModel.getSoftwareStatistics();
            res.json(statistics);
        } catch (error) {
            console.error('Error fetching software statistics:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // GET /api/software-used/count
    async getCount(req, res) {
        try {
            const count = await this.softwareUsedModel.getCount();
            res.json({ count });
        } catch (error) {
            console.error('Error fetching software used count:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // GET /api/software-used/pdb/:pdb_id
    async getByPdbId(req, res) {
        try {
            const { pdb_id } = req.params;
            const records = await this.softwareUsedModel.getByPdbId(pdb_id);
            res.json(records);
        } catch (error) {
            console.error('Error fetching software used by PDB ID:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // GET /api/software-used/top-software
    async getTopSoftware(req, res) {
        try {
            const { limit = 20 } = req.query;
            
            const software = await this.softwareUsedModel.getTopSoftware({
                limit: parseInt(limit)
            });

            res.json(software);
        } catch (error) {
            console.error('Error fetching top software:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // GET /api/software-used/by-classification
    async getSoftwareByClassification(req, res) {
        try {
            const { limit = 50 } = req.query;
            
            const classifications = await this.softwareUsedModel.getSoftwareByClassification({
                limit: parseInt(limit)
            });

            res.json(classifications);
        } catch (error) {
            console.error('Error fetching software by classification:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // GET /api/software-used/version-distribution/:software_name
    async getVersionDistribution(req, res) {
        try {
            const { software_name } = req.params;
            const { limit = 50 } = req.query;
            
            const versions = await this.softwareUsedModel.getVersionDistribution(software_name, {
                limit: parseInt(limit)
            });

            res.json(versions);
        } catch (error) {
            console.error('Error fetching version distribution:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // GET /api/software-used/co-usage
    async getSoftwareCoUsage(req, res) {
        try {
            const { limit = 100 } = req.query;
            
            const coUsage = await this.softwareUsedModel.getSoftwareCoUsage({
                limit: parseInt(limit)
            });

            res.json(coUsage);
        } catch (error) {
            console.error('Error fetching software co-usage:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // GET /api/software-used/proteins-with-multiple-software
    async getProteinsWithMultipleSoftware(req, res) {
        try {
            const { limit = 50, offset = 0 } = req.query;
            
            const proteins = await this.softwareUsedModel.getProteinsWithMultipleSoftware({
                limit: parseInt(limit),
                offset: parseInt(offset)
            });

            res.json(proteins);
        } catch (error) {
            console.error('Error fetching proteins with multiple software:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // GET /api/software-used/evolution-timeline/:software_name
    async getSoftwareEvolutionTimeline(req, res) {
        try {
            const { software_name } = req.params;
            
            const timeline = await this.softwareUsedModel.getSoftwareEvolutionTimeline(software_name);

            res.json(timeline);
        } catch (error) {
            console.error('Error fetching software evolution timeline:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // GET /api/software-used/classification-trends
    async getClassificationTrends(req, res) {
        try {
            const trends = await this.softwareUsedModel.getClassificationTrends();
            res.json(trends);
        } catch (error) {
            console.error('Error fetching classification trends:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // POST /api/software-used/advanced-search
    async advancedSearch(req, res) {
        try {
            const { criteria, limit = 50, offset = 0 } = req.body;
            
            const results = await this.softwareUsedModel.advancedSearch(criteria, {
                limit: parseInt(limit),
                offset: parseInt(offset)
            });

            res.json(results);
        } catch (error) {
            console.error('Error in advanced search:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // POST /api/software-used
    async createSoftware(req, res) {
        try {
            const recordData = req.body;
            const newRecord = await this.softwareUsedModel.create(recordData);
            res.status(201).json(newRecord);
        } catch (error) {
            console.error('Error creating software record:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // PUT /api/software-used/:id
    async updateSoftware(req, res) {
        try {
            const { id } = req.params;
            const updates = req.body;
            
            const updatedRecord = await this.softwareUsedModel.update(id, updates);
            
            if (!updatedRecord) {
                return res.status(404).json({ error: 'Software record not found' });
            }

            res.json(updatedRecord);
        } catch (error) {
            console.error('Error updating software record:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // DELETE /api/software-used/:id
    async deleteSoftware(req, res) {
        try {
            const { id } = req.params;
            const success = await this.softwareUsedModel.delete(id);
            
            if (!success) {
                return res.status(404).json({ error: 'Software record not found' });
            }

            res.json({ message: 'Software record deleted successfully' });
        } catch (error) {
            console.error('Error deleting software record:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}

module.exports = SoftwareUsedController;
