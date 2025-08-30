// backend/routes/proteinInfoRoutes.js
const express = require('express');
const ProteinInfoController = require('../controllers/ProteinInfoController');

const router = express.Router();
const proteinInfoController = new ProteinInfoController();

// Basic CRUD operations
router.get('/', proteinInfoController.getAllProteins.bind(proteinInfoController));
router.get('/count', proteinInfoController.getCount.bind(proteinInfoController));
router.get('/search', proteinInfoController.searchProteinsGet.bind(proteinInfoController));
router.get('/statistics', proteinInfoController.getStatistics.bind(proteinInfoController));
router.get('/classification-distribution', proteinInfoController.getClassificationDistribution.bind(proteinInfoController));
router.get('/organism-distribution', proteinInfoController.getOrganismDistribution.bind(proteinInfoController));
router.get('/molecular-weight-distribution', proteinInfoController.getMolecularWeightDistribution.bind(proteinInfoController));
router.get('/by-molecular-weight', proteinInfoController.getByMolecularWeightRange.bind(proteinInfoController));
router.get('/by-date-range', proteinInfoController.getByDateRange.bind(proteinInfoController));
router.get('/by-classification/:classification', proteinInfoController.getByClassification.bind(proteinInfoController));
router.get('/by-organism/:organism', proteinInfoController.getByOrganism.bind(proteinInfoController));
router.get('/:pdb_id', proteinInfoController.getProteinById.bind(proteinInfoController));

router.post('/', proteinInfoController.createProtein.bind(proteinInfoController));
router.post('/search', proteinInfoController.searchProteins.bind(proteinInfoController));
router.post('/advanced-search', proteinInfoController.advancedSearch.bind(proteinInfoController));

router.put('/:pdb_id', proteinInfoController.updateProtein.bind(proteinInfoController));
router.delete('/:pdb_id', proteinInfoController.deleteProtein.bind(proteinInfoController));

module.exports = router;
