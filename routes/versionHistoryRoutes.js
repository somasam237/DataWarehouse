// backend/routes/versionHistoryRoutes.js
const express = require('express');
const VersionHistoryController = require('../controllers/VersionHistoryController');

const router = express.Router();
const versionHistoryController = new VersionHistoryController();

// Basic CRUD operations
router.get('/', versionHistoryController.getAllVersionHistory.bind(versionHistoryController));
router.get('/statistics', versionHistoryController.getVersionStatistics.bind(versionHistoryController));
router.get('/revision-type-distribution', versionHistoryController.getRevisionTypeDistribution.bind(versionHistoryController));
router.get('/most-revised-proteins', versionHistoryController.getMostRevisedProteins.bind(versionHistoryController));
router.get('/revision-timeline', versionHistoryController.getRevisionTimeline.bind(versionHistoryController));
router.get('/revision-frequency-analysis', versionHistoryController.getRevisionFrequencyAnalysis.bind(versionHistoryController));
router.get('/recent-revisions', versionHistoryController.getRecentRevisions.bind(versionHistoryController));
router.get('/proteins-without-revisions', versionHistoryController.getProteinsWithoutRevisions.bind(versionHistoryController));
router.get('/by-date-range', versionHistoryController.getByDateRange.bind(versionHistoryController));
router.get('/by-revision-type/:revision_type', versionHistoryController.getByRevisionType.bind(versionHistoryController));
router.get('/by-version/:version_number', versionHistoryController.getByVersionNumber.bind(versionHistoryController));
router.get('/by-pdb/:pdb_id', versionHistoryController.getByPdbId.bind(versionHistoryController));
router.get('/latest/:pdb_id', versionHistoryController.getLatestVersion.bind(versionHistoryController));
router.get('/:id', versionHistoryController.getVersionHistoryById.bind(versionHistoryController));

router.post('/', versionHistoryController.createVersionHistory.bind(versionHistoryController));
router.post('/advanced-search', versionHistoryController.advancedSearch.bind(versionHistoryController));

router.put('/:id', versionHistoryController.updateVersionHistory.bind(versionHistoryController));
router.delete('/:id', versionHistoryController.deleteVersionHistory.bind(versionHistoryController));

module.exports = router;
