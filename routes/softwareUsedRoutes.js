// backend/routes/softwareUsedRoutes.js
const express = require('express');
const SoftwareUsedController = require('../controllers/SoftwareUsedController');

const router = express.Router();
const softwareUsedController = new SoftwareUsedController();

// Basic CRUD operations
router.get('/', softwareUsedController.getAllSoftware.bind(softwareUsedController));
router.get('/statistics', softwareUsedController.getSoftwareStatistics.bind(softwareUsedController));
router.get('/top-software', softwareUsedController.getTopSoftware.bind(softwareUsedController));
router.get('/by-classification', softwareUsedController.getSoftwareByClassification.bind(softwareUsedController));
router.get('/co-usage', softwareUsedController.getSoftwareCoUsage.bind(softwareUsedController));
router.get('/proteins-with-multiple-software', softwareUsedController.getProteinsWithMultipleSoftware.bind(softwareUsedController));
router.get('/classification-trends', softwareUsedController.getClassificationTrends.bind(softwareUsedController));
router.get('/version-distribution/:software_name', softwareUsedController.getVersionDistribution.bind(softwareUsedController));
router.get('/evolution-timeline/:software_name', softwareUsedController.getSoftwareEvolutionTimeline.bind(softwareUsedController));
router.get('/search/software-name', softwareUsedController.searchBySoftwareName.bind(softwareUsedController));
router.get('/search/classification', softwareUsedController.searchByClassification.bind(softwareUsedController));
router.get('/search/version', softwareUsedController.searchByVersion.bind(softwareUsedController));
router.get('/by-pdb/:pdb_id', softwareUsedController.getByPdbId.bind(softwareUsedController));
router.get('/:id', softwareUsedController.getSoftwareById.bind(softwareUsedController));

router.post('/', softwareUsedController.createSoftware.bind(softwareUsedController));
router.post('/advanced-search', softwareUsedController.advancedSearch.bind(softwareUsedController));

router.put('/:id', softwareUsedController.updateSoftware.bind(softwareUsedController));
router.delete('/:id', softwareUsedController.deleteSoftware.bind(softwareUsedController));

module.exports = router;
