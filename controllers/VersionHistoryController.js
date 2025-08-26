// backend/controllers/VersionHistoryController.js
const VersionHistoryModel = require('../models/VersionHistoryModel');

class VersionHistoryController {
    constructor() {
        this.versionHistoryModel = new VersionHistoryModel();
    }

    // GET /api/version-history
    async getAllVersionHistory(req, res) {
        try {
            const { limit = 50, offset = 0, sortBy = 'pdb_id', sortOrder = 'ASC' } = req.query;
            
            const records = await this.versionHistoryModel.readAll({
                limit: parseInt(limit),
                offset: parseInt(offset),
                sortBy,
                sortOrder
            });

            res.json(records);
        } catch (error) {
            console.error('Error fetching version history:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // GET /api/version-history/:id
    async getVersionHistoryById(req, res) {
        try {
            const { id } = req.params;
            const record = await this.versionHistoryModel.readOne(id);
            
            if (!record) {
                return res.status(404).json({ error: 'Version history record not found' });
            }

            res.json(record);
        } catch (error) {
            console.error('Error fetching version history record:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // GET /api/version-history/by-pdb/:pdb_id
    async getByPdbId(req, res) {
        try {
            const { pdb_id } = req.params;
            const records = await this.versionHistoryModel.getByPdbId(pdb_id);
            res.json(records);
        } catch (error) {
            console.error('Error fetching version history by PDB ID:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // GET /api/version-history/latest/:pdb_id
    async getLatestVersion(req, res) {
        try {
            const { pdb_id } = req.params;
            const record = await this.versionHistoryModel.getLatestVersion(pdb_id);
            
            if (!record) {
                return res.status(404).json({ error: 'No version history found for this PDB ID' });
            }

            res.json(record);
        } catch (error) {
            console.error('Error fetching latest version:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // GET /api/version-history/by-revision-type/:revision_type
    async getByRevisionType(req, res) {
        try {
            const { revision_type } = req.params;
            const { limit = 50, offset = 0 } = req.query;
            
            const records = await this.versionHistoryModel.getByRevisionType(revision_type, {
                limit: parseInt(limit),
                offset: parseInt(offset)
            });

            res.json(records);
        } catch (error) {
            console.error('Error fetching version history by revision type:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // GET /api/version-history/by-date-range
    async getByDateRange(req, res) {
        try {
            const { start_date, end_date, limit = 50, offset = 0 } = req.query;
            
            if (!start_date || !end_date) {
                return res.status(400).json({ error: 'Both start_date and end_date are required' });
            }

            const records = await this.versionHistoryModel.getByDateRange(start_date, end_date, {
                limit: parseInt(limit),
                offset: parseInt(offset)
            });

            res.json(records);
        } catch (error) {
            console.error('Error fetching version history by date range:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // GET /api/version-history/by-version/:version_number
    async getByVersionNumber(req, res) {
        try {
            const { version_number } = req.params;
            const { limit = 50, offset = 0 } = req.query;
            
            const records = await this.versionHistoryModel.getByVersionNumber(parseInt(version_number), {
                limit: parseInt(limit),
                offset: parseInt(offset)
            });

            res.json(records);
        } catch (error) {
            console.error('Error fetching version history by version number:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // GET /api/version-history/statistics
    async getVersionStatistics(req, res) {
        try {
            const statistics = await this.versionHistoryModel.getVersionStatistics();
            res.json(statistics);
        } catch (error) {
            console.error('Error fetching version statistics:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // GET /api/version-history/revision-type-distribution
    async getRevisionTypeDistribution(req, res) {
        try {
            const distribution = await this.versionHistoryModel.getRevisionTypeDistribution();
            res.json(distribution);
        } catch (error) {
            console.error('Error fetching revision type distribution:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // GET /api/version-history/most-revised-proteins
    async getMostRevisedProteins(req, res) {
        try {
            const { limit = 20 } = req.query;
            
            const proteins = await this.versionHistoryModel.getMostRevisedProteins({
                limit: parseInt(limit)
            });

            res.json(proteins);
        } catch (error) {
            console.error('Error fetching most revised proteins:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // GET /api/version-history/revision-timeline
    async getRevisionTimeline(req, res) {
        try {
            const { limit = 100 } = req.query;
            
            const timeline = await this.versionHistoryModel.getRevisionTimeline({
                limit: parseInt(limit)
            });

            res.json(timeline);
        } catch (error) {
            console.error('Error fetching revision timeline:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // GET /api/version-history/revision-frequency-analysis
    async getRevisionFrequencyAnalysis(req, res) {
        try {
            const analysis = await this.versionHistoryModel.getRevisionFrequencyAnalysis();
            res.json(analysis);
        } catch (error) {
            console.error('Error fetching revision frequency analysis:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // GET /api/version-history/recent-revisions
    async getRecentRevisions(req, res) {
        try {
            const { days = 30, limit = 50 } = req.query;
            
            const revisions = await this.versionHistoryModel.getRecentRevisions(parseInt(days), {
                limit: parseInt(limit)
            });

            res.json(revisions);
        } catch (error) {
            console.error('Error fetching recent revisions:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // GET /api/version-history/proteins-without-revisions
    async getProteinsWithoutRevisions(req, res) {
        try {
            const { limit = 50, offset = 0 } = req.query;
            
            const proteins = await this.versionHistoryModel.getProteinsWithoutRevisions({
                limit: parseInt(limit),
                offset: parseInt(offset)
            });

            res.json(proteins);
        } catch (error) {
            console.error('Error fetching proteins without revisions:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // POST /api/version-history/advanced-search
    async advancedSearch(req, res) {
        try {
            const { criteria, limit = 50, offset = 0 } = req.body;
            
            const results = await this.versionHistoryModel.advancedSearch(criteria, {
                limit: parseInt(limit),
                offset: parseInt(offset)
            });

            res.json(results);
        } catch (error) {
            console.error('Error in advanced search:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // POST /api/version-history
    async createVersionHistory(req, res) {
        try {
            const recordData = req.body;
            const newRecord = await this.versionHistoryModel.create(recordData);
            res.status(201).json(newRecord);
        } catch (error) {
            console.error('Error creating version history record:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // PUT /api/version-history/:id
    async updateVersionHistory(req, res) {
        try {
            const { id } = req.params;
            const updates = req.body;
            
            const updatedRecord = await this.versionHistoryModel.update(id, updates);
            
            if (!updatedRecord) {
                return res.status(404).json({ error: 'Version history record not found' });
            }

            res.json(updatedRecord);
        } catch (error) {
            console.error('Error updating version history record:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // DELETE /api/version-history/:id
    async deleteVersionHistory(req, res) {
        try {
            const { id } = req.params;
            const success = await this.versionHistoryModel.delete(id);
            
            if (!success) {
                return res.status(404).json({ error: 'Version history record not found' });
            }

            res.json({ message: 'Version history record deleted successfully' });
        } catch (error) {
            console.error('Error deleting version history record:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}

module.exports = VersionHistoryController;
