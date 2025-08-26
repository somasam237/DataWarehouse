// backend/controllers/organismsControllerNew.js
const OrganismModel = require('../models/OrganismModel');

class OrganismsController {
    constructor() {
        this.organismModel = new OrganismModel();
    }

    // GET /api/organisms
    async getAllOrganisms(req, res) {
        try {
            const { limit = 50, offset = 0, sortBy = 'scientific_name', sortOrder = 'ASC' } = req.query;
            
            const organisms = await this.organismModel.readAll({
                limit: parseInt(limit),
                offset: parseInt(offset),
                sortBy,
                sortOrder
            });

            res.json(organisms);
        } catch (error) {
            console.error('Error fetching organisms:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // GET /api/organisms/:id
    async getOrganismById(req, res) {
        try {
            const { id } = req.params;
            const organism = await this.organismModel.readOne(id);
            
            if (!organism) {
                return res.status(404).json({ error: 'Organism not found' });
            }

            res.json(organism);
        } catch (error) {
            console.error('Error fetching organism:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // POST /api/organisms/search
    async searchOrganisms(req, res) {
        try {
            const { query, limit = 50, offset = 0 } = req.body;
            
            const results = await this.organismModel.search(query, {
                limit: parseInt(limit),
                offset: parseInt(offset)
            });

            res.json(results);
        } catch (error) {
            console.error('Error searching organisms:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // GET /api/organisms/search (for GET requests)
    async searchOrganismsGet(req, res) {
        try {
            const { query, limit = 50, offset = 0 } = req.query;
            
            const results = await this.organismModel.search(query, {
                limit: parseInt(limit),
                offset: parseInt(offset)
            });

            res.json(results);
        } catch (error) {
            console.error('Error searching organisms:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // POST /api/organisms/search/taxonomy
    async searchWithTaxonomy(req, res) {
        try {
            const { 
                kingdom, 
                phylum, 
                class: classParam, 
                order, 
                family, 
                genus, 
                species,
                limit = 50, 
                offset = 0 
            } = req.body;
            
            const results = await this.organismModel.searchWithTaxonomy({
                kingdom,
                phylum,
                class: classParam,
                order,
                family,
                genus,
                species,
                limit: parseInt(limit),
                offset: parseInt(offset)
            });

            res.json(results);
        } catch (error) {
            console.error('Error searching organisms with taxonomy:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // GET /api/organisms/:id/taxonomic-tree
    async getTaxonomicTree(req, res) {
        try {
            const { id } = req.params;
            
            const tree = await this.organismModel.getTaxonomicTree(id);

            res.json(tree);
        } catch (error) {
            console.error('Error fetching taxonomic tree:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // GET /api/organisms/:id/related
    async getRelatedOrganisms(req, res) {
        try {
            const { id } = req.params;
            const { limit = 20 } = req.query;
            
            const relatedOrganisms = await this.organismModel.findRelatedOrganisms(id, {
                limit: parseInt(limit)
            });

            res.json(relatedOrganisms);
        } catch (error) {
            console.error('Error fetching related organisms:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // POST /api/organisms
    async createOrganism(req, res) {
        try {
            const organismData = req.body;
            const newOrganism = await this.organismModel.create(organismData);
            res.status(201).json(newOrganism);
        } catch (error) {
            console.error('Error creating organism:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // PUT /api/organisms/:id
    async updateOrganism(req, res) {
        try {
            const { id } = req.params;
            const updates = req.body;
            
            const updatedOrganism = await this.organismModel.update(id, updates);
            
            if (!updatedOrganism) {
                return res.status(404).json({ error: 'Organism not found' });
            }

            res.json(updatedOrganism);
        } catch (error) {
            console.error('Error updating organism:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // DELETE /api/organisms/:id
    async deleteOrganism(req, res) {
        try {
            const { id } = req.params;
            const success = await this.organismModel.delete(id);
            
            if (!success) {
                return res.status(404).json({ error: 'Organism not found' });
            }

            res.json({ message: 'Organism deleted successfully' });
        } catch (error) {
            console.error('Error deleting organism:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // GET /api/organisms/statistics
    async getOrganismStatistics(req, res) {
        try {
            const statistics = await this.organismModel.getStatistics();
            res.json(statistics);
        } catch (error) {
            console.error('Error fetching organism statistics:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // GET /api/organisms/kingdoms
    async getKingdoms(req, res) {
        try {
            const kingdoms = await this.organismModel.getKingdoms();
            res.json(kingdoms);
        } catch (error) {
            console.error('Error fetching kingdoms:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // GET /api/organisms/by-kingdom/:kingdom
    async getOrganismsByKingdom(req, res) {
        try {
            const { kingdom } = req.params;
            const { limit = 50 } = req.query;
            
            const organisms = await this.organismModel.getOrganismsByKingdom(kingdom, {
                limit: parseInt(limit)
            });

            res.json(organisms);
        } catch (error) {
            console.error('Error fetching organisms by kingdom:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // GET /api/organisms/by-taxonomy-id/:taxonomyId
    async getOrganismByTaxonomyId(req, res) {
        try {
            const { taxonomyId } = req.params;
            
            const organism = await this.organismModel.getOrganismByTaxonomyId(taxonomyId);
            
            if (!organism) {
                return res.status(404).json({ error: 'Organism not found' });
            }

            res.json(organism);
        } catch (error) {
            console.error('Error fetching organism by taxonomy ID:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // GET /api/organisms/phylogenetic-distance
    async getPhylogeneticDistance(req, res) {
        try {
            const { organism1Id, organism2Id } = req.query;
            
            const distance = await this.organismModel.getPhylogeneticDistance(
                organism1Id, 
                organism2Id
            );

            res.json({ distance });
        } catch (error) {
            console.error('Error calculating phylogenetic distance:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}

module.exports = OrganismsController;
