// backend/routes/organismsRoutesNew.js
const express = require('express');
const router = express.Router();
const OrganismsController = require('../controllers/organismsControllerNew');

const organismsController = new OrganismsController();

// GET /api/organisms - Get all organisms
router.get('/', organismsController.getAllOrganisms.bind(organismsController));

// GET /api/organisms/statistics - Get organism statistics
router.get('/statistics', organismsController.getOrganismStatistics.bind(organismsController));

// GET /api/organisms/kingdoms - Get all kingdoms
router.get('/kingdoms', organismsController.getKingdoms.bind(organismsController));

// GET /api/organisms/by-kingdom/:kingdom - Get organisms by kingdom
router.get('/by-kingdom/:kingdom', organismsController.getOrganismsByKingdom.bind(organismsController));

// GET /api/organisms/by-taxonomy-id/:taxonomyId - Get organism by taxonomy ID
router.get('/by-taxonomy-id/:taxonomyId', organismsController.getOrganismByTaxonomyId.bind(organismsController));

// GET /api/organisms/phylogenetic-distance - Get phylogenetic distance between organisms
router.get('/phylogenetic-distance', organismsController.getPhylogeneticDistance.bind(organismsController));

// GET /api/organisms/search - Search organisms (GET)
router.get('/search', organismsController.searchOrganismsGet.bind(organismsController));

// POST /api/organisms/search - Search organisms (POST)
router.post('/search', organismsController.searchOrganisms.bind(organismsController));

// POST /api/organisms/search/taxonomy - Search organisms with taxonomy
router.post('/search/taxonomy', organismsController.searchWithTaxonomy.bind(organismsController));

// GET /api/organisms/:id - Get organism by ID
router.get('/:id', organismsController.getOrganismById.bind(organismsController));

// GET /api/organisms/:id/taxonomic-tree - Get taxonomic tree for organism
router.get('/:id/taxonomic-tree', organismsController.getTaxonomicTree.bind(organismsController));

// GET /api/organisms/:id/related - Get related organisms
router.get('/:id/related', organismsController.getRelatedOrganisms.bind(organismsController));

// POST /api/organisms - Create new organism
router.post('/', organismsController.createOrganism.bind(organismsController));

// PUT /api/organisms/:id - Update organism
router.put('/:id', organismsController.updateOrganism.bind(organismsController));

// DELETE /api/organisms/:id - Delete organism
router.delete('/:id', organismsController.deleteOrganism.bind(organismsController));

module.exports = router;
