// backend/controllers/citationsControllerNew.js
const CitationModel = require('../models/CitationModel');

class CitationsController {
    constructor() {
        this.citationModel = new CitationModel();
    }

    // GET /api/citations
    async getAllCitations(req, res) {
        try {
            const { limit = 50, offset = 0, sortBy = 'year', sortOrder = 'DESC' } = req.query;
            
            const citations = await this.citationModel.readAll({
                limit: parseInt(limit),
                offset: parseInt(offset),
                sortBy,
                sortOrder
            });

            res.json(citations);
        } catch (error) {
            console.error('Error fetching citations:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // GET /api/citations/:id
    async getCitationById(req, res) {
        try {
            const { id } = req.params;
            const citation = await this.citationModel.readOne(id);
            
            if (!citation) {
                return res.status(404).json({ error: 'Citation not found' });
            }

            res.json(citation);
        } catch (error) {
            console.error('Error fetching citation:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // POST /api/citations/search
    async searchCitations(req, res) {
        try {
            const { query, limit = 50, offset = 0 } = req.body;
            
            const results = await this.citationModel.search(query, {
                limit: parseInt(limit),
                offset: parseInt(offset)
            });

            res.json(results);
        } catch (error) {
            console.error('Error searching citations:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // GET /api/citations/search (for GET requests)
    async searchCitationsGet(req, res) {
        try {
            const { query, limit = 50, offset = 0 } = req.query;
            
            const results = await this.citationModel.search(query, {
                limit: parseInt(limit),
                offset: parseInt(offset)
            });

            res.json(results);
        } catch (error) {
            console.error('Error searching citations:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // POST /api/citations/search/publication
    async searchWithPublicationInfo(req, res) {
        try {
            const { 
                journal, 
                year, 
                authors, 
                doi, 
                title,
                limit = 50, 
                offset = 0 
            } = req.body;
            
            const results = await this.citationModel.searchWithPublicationInfo({
                journal,
                year,
                authors,
                doi,
                title,
                limit: parseInt(limit),
                offset: parseInt(offset)
            });

            res.json(results);
        } catch (error) {
            console.error('Error searching citations with publication info:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // GET /api/citations/statistics
    async getCitationStatistics(req, res) {
        try {
            const statistics = await this.citationModel.getCitationStatistics();
            res.json(statistics);
        } catch (error) {
            console.error('Error fetching citation statistics:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // GET /api/citations/author-collaborations
    async getAuthorCollaborations(req, res) {
        try {
            const { limit = 50 } = req.query;
            
            const collaborations = await this.citationModel.getAuthorCollaborations({
                limit: parseInt(limit)
            });

            res.json(collaborations);
        } catch (error) {
            console.error('Error fetching author collaborations:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // POST /api/citations
    async createCitation(req, res) {
        try {
            const citationData = req.body;
            const newCitation = await this.citationModel.create(citationData);
            res.status(201).json(newCitation);
        } catch (error) {
            console.error('Error creating citation:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // PUT /api/citations/:id
    async updateCitation(req, res) {
        try {
            const { id } = req.params;
            const updates = req.body;
            
            const updatedCitation = await this.citationModel.update(id, updates);
            
            if (!updatedCitation) {
                return res.status(404).json({ error: 'Citation not found' });
            }

            res.json(updatedCitation);
        } catch (error) {
            console.error('Error updating citation:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // DELETE /api/citations/:id
    async deleteCitation(req, res) {
        try {
            const { id } = req.params;
            const success = await this.citationModel.delete(id);
            
            if (!success) {
                return res.status(404).json({ error: 'Citation not found' });
            }

            res.json({ message: 'Citation deleted successfully' });
        } catch (error) {
            console.error('Error deleting citation:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // GET /api/citations/by-year/:year
    async getCitationsByYear(req, res) {
        try {
            const { year } = req.params;
            const { limit = 50 } = req.query;
            
            const citations = await this.citationModel.getCitationsByYear(year, {
                limit: parseInt(limit)
            });

            res.json(citations);
        } catch (error) {
            console.error('Error fetching citations by year:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // GET /api/citations/by-journal/:journal
    async getCitationsByJournal(req, res) {
        try {
            const { journal } = req.params;
            const { limit = 50 } = req.query;
            
            const citations = await this.citationModel.getCitationsByJournal(journal, {
                limit: parseInt(limit)
            });

            res.json(citations);
        } catch (error) {
            console.error('Error fetching citations by journal:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // GET /api/citations/by-author/:author
    async getCitationsByAuthor(req, res) {
        try {
            const { author } = req.params;
            const { limit = 50 } = req.query;
            
            const citations = await this.citationModel.getCitationsByAuthor(author, {
                limit: parseInt(limit)
            });

            res.json(citations);
        } catch (error) {
            console.error('Error fetching citations by author:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // GET /api/citations/journals
    async getJournals(req, res) {
        try {
            const { limit = 100 } = req.query;
            
            const journals = await this.citationModel.getJournals({
                limit: parseInt(limit)
            });

            res.json(journals);
        } catch (error) {
            console.error('Error fetching journals:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // GET /api/citations/publication-trends
    async getPublicationTrends(req, res) {
        try {
            const { startYear, endYear } = req.query;
            
            const trends = await this.citationModel.getPublicationTrends({
                startYear: startYear ? parseInt(startYear) : undefined,
                endYear: endYear ? parseInt(endYear) : undefined
            });

            res.json(trends);
        } catch (error) {
            console.error('Error fetching publication trends:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // GET /api/citations/top-authors
    async getTopAuthors(req, res) {
        try {
            const { limit = 20 } = req.query;
            
            const authors = await this.citationModel.getTopAuthors({
                limit: parseInt(limit)
            });

            res.json(authors);
        } catch (error) {
            console.error('Error fetching top authors:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // GET /api/citations/by-doi/:doi
    async getCitationByDOI(req, res) {
        try {
            const { doi } = req.params;
            
            const citation = await this.citationModel.getCitationByDOI(doi);
            
            if (!citation) {
                return res.status(404).json({ error: 'Citation not found' });
            }

            res.json(citation);
        } catch (error) {
            console.error('Error fetching citation by DOI:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}

module.exports = CitationsController;
