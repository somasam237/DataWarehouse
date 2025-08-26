// backend/routes/experimentalDataRoutes.js
const express = require('express');
const ExperimentalDataController = require('../controllers/ExperimentalDataController');

const router = express.Router();
const experimentalDataController = new ExperimentalDataController();

// Basic CRUD operations
router.get('/', experimentalDataController.getAllExperimentalData.bind(experimentalDataController));
router.get('/statistics', experimentalDataController.getExperimentalStatistics.bind(experimentalDataController));
router.get('/method-distribution', experimentalDataController.getMethodDistribution.bind(experimentalDataController));
router.get('/resolution-r-factor-correlation', experimentalDataController.getResolutionRFactorCorrelation.bind(experimentalDataController));
router.get('/quality-metrics-by-method', experimentalDataController.getQualityMetricsByMethod.bind(experimentalDataController));
router.get('/by-resolution', experimentalDataController.getByResolutionRange.bind(experimentalDataController));
router.get('/by-r-factor', experimentalDataController.getByRFactorRange.bind(experimentalDataController));
router.get('/by-method/:method', experimentalDataController.getByMethod.bind(experimentalDataController));
router.get('/by-pdb/:pdb_id', experimentalDataController.getByPdbId.bind(experimentalDataController));
router.get('/:id', experimentalDataController.getExperimentalDataById.bind(experimentalDataController));

router.post('/', experimentalDataController.createExperimentalData.bind(experimentalDataController));
router.post('/advanced-search', experimentalDataController.advancedSearch.bind(experimentalDataController));

router.put('/:id', experimentalDataController.updateExperimentalData.bind(experimentalDataController));
router.delete('/:id', experimentalDataController.deleteExperimentalData.bind(experimentalDataController));

module.exports = router;
