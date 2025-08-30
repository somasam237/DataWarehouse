// backend/controllers/AuthorsFundingController.js
const AuthorsFundingModel = require('../models/AuthorsFundingModel');

class AuthorsFundingController {
    constructor() {
        this.authorsFundingModel = new AuthorsFundingModel();
    }

    // GET /api/authors-funding
    async getAllAuthorsFunding(req, res) {
        try {
            const { limit = 50, offset = 0, sortBy = 'pdb_id', sortOrder = 'ASC' } = req.query;
            
            const records = await this.authorsFundingModel.readAll({
                limit: parseInt(limit),
                offset: parseInt(offset),
                sortBy,
                sortOrder
            });

            res.json(records);
        } catch (error) {
            console.error('Error fetching authors/funding records:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // GET /api/authors-funding/:id
    async getAuthorsFundingById(req, res) {
        try {
            const { id } = req.params;
            const record = await this.authorsFundingModel.readOne(id);
            
            if (!record) {
                return res.status(404).json({ error: 'Authors/funding record not found' });
            }

            res.json(record);
        } catch (error) {
            console.error('Error fetching authors/funding record:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // GET /api/authors-funding/by-pdb/:pdb_id
    async getByPdbId(req, res) {
        try {
            const { pdb_id } = req.params;
            const records = await this.authorsFundingModel.getByPdbId(pdb_id);
            res.json(records);
        } catch (error) {
            console.error('Error fetching authors/funding by PDB ID:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // GET /api/authors-funding/search/author
    async searchByAuthor(req, res) {
        try {
            const { author_name, limit = 50, offset = 0 } = req.query;
            
            if (!author_name) {
                return res.status(400).json({ error: 'author_name parameter is required' });
            }

            const results = await this.authorsFundingModel.searchByAuthor(author_name, {
                limit: parseInt(limit),
                offset: parseInt(offset)
            });

            res.json(results);
        } catch (error) {
            console.error('Error searching by author:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // GET /api/authors-funding/search/funding
    async searchByFunding(req, res) {
        try {
            const { funding_org, limit = 50, offset = 0 } = req.query;
            
            if (!funding_org) {
                return res.status(400).json({ error: 'funding_org parameter is required' });
            }

            const results = await this.authorsFundingModel.searchByFunding(funding_org, {
                limit: parseInt(limit),
                offset: parseInt(offset)
            });

            res.json(results);
        } catch (error) {
            console.error('Error searching by funding organization:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // GET /api/authors-funding/statistics
    async getFundingStatistics(req, res) {
        try {
            const statistics = await this.authorsFundingModel.getFundingStatistics();
            res.json(statistics);
        } catch (error) {
            console.error('Error fetching funding statistics:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // GET /api/authors-funding/count
    async getCount(req, res) {
        try {
            const count = await this.authorsFundingModel.getCount();
            res.json({ count });
        } catch (error) {
            console.error('Error fetching authors/funding count:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // GET /api/authors-funding/search
    async searchAuthorsFunding(req, res) {
        try {
            const { search, limit = 50, offset = 0 } = req.query;
            
            if (!search) {
                return res.status(400).json({ error: 'Search term is required' });
            }
            
            const results = await this.authorsFundingModel.search(search, {
                limit: parseInt(limit),
                offset: parseInt(offset)
            });

            res.json(results);
        } catch (error) {
            console.error('Error searching authors/funding:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // GET /api/authors-funding/top-funding-organizations
    async getTopFundingOrganizations(req, res) {
        try {
            const { limit = 20 } = req.query;
            
            const organizations = await this.authorsFundingModel.getTopFundingOrganizations({
                limit: parseInt(limit)
            });

            res.json(organizations);
        } catch (error) {
            console.error('Error fetching top funding organizations:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // GET /api/authors-funding/funding-by-location
    async getFundingByLocation(req, res) {
        try {
            const { limit = 50 } = req.query;
            
            const locations = await this.authorsFundingModel.getFundingByLocation({
                limit: parseInt(limit)
            });

            res.json(locations);
        } catch (error) {
            console.error('Error fetching funding by location:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // GET /api/authors-funding/author-collaborations
    async getAuthorCollaborations(req, res) {
        try {
            const { limit = 100 } = req.query;
            
            const collaborations = await this.authorsFundingModel.getAuthorCollaborations({
                limit: parseInt(limit)
            });

            res.json(collaborations);
        } catch (error) {
            console.error('Error fetching author collaborations:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // GET /api/authors-funding/top-authors
    async getTopAuthors(req, res) {
        try {
            const { limit = 20 } = req.query;
            
            const authors = await this.authorsFundingModel.getTopAuthors({
                limit: parseInt(limit)
            });

            res.json(authors);
        } catch (error) {
            console.error('Error fetching top authors:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // POST /api/authors-funding
    async createAuthorsFunding(req, res) {
        try {
            const recordData = req.body;
            const newRecord = await this.authorsFundingModel.create(recordData);
            res.status(201).json(newRecord);
        } catch (error) {
            console.error('Error creating authors/funding record:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // PUT /api/authors-funding/:id
    async updateAuthorsFunding(req, res) {
        try {
            const { id } = req.params;
            const updates = req.body;
            
            const updatedRecord = await this.authorsFundingModel.update(id, updates);
            
            if (!updatedRecord) {
                return res.status(404).json({ error: 'Authors/funding record not found' });
            }

            res.json(updatedRecord);
        } catch (error) {
            console.error('Error updating authors/funding record:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // DELETE /api/authors-funding/:id
    async deleteAuthorsFunding(req, res) {
        try {
            const { id } = req.params;
            const success = await this.authorsFundingModel.delete(id);
            
            if (!success) {
                return res.status(404).json({ error: 'Authors/funding record not found' });
            }

            res.json({ message: 'Authors/funding record deleted successfully' });
        } catch (error) {
            console.error('Error deleting authors/funding record:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}

module.exports = AuthorsFundingController;
