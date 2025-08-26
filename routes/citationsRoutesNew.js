// backend/routes/citationsRoutesNew.js
const express = require('express');
const router = express.Router();
const CitationsController = require('../controllers/citationsControllerNew');

const citationsController = new CitationsController();

// GET /api/citations - Get all citations
router.get('/', citationsController.getAllCitations.bind(citationsController));

// GET /api/citations/statistics - Get citation statistics
router.get('/statistics', citationsController.getCitationStatistics.bind(citationsController));

// GET /api/citations/author-collaborations - Get author collaborations
router.get('/author-collaborations', citationsController.getAuthorCollaborations.bind(citationsController));

// GET /api/citations/journals - Get all journals
router.get('/journals', citationsController.getJournals.bind(citationsController));

// GET /api/citations/publication-trends - Get publication trends
router.get('/publication-trends', citationsController.getPublicationTrends.bind(citationsController));

// GET /api/citations/top-authors - Get top authors
router.get('/top-authors', citationsController.getTopAuthors.bind(citationsController));

// GET /api/citations/by-year/:year - Get citations by year
router.get('/by-year/:year', citationsController.getCitationsByYear.bind(citationsController));

// GET /api/citations/by-journal/:journal - Get citations by journal
router.get('/by-journal/:journal', citationsController.getCitationsByJournal.bind(citationsController));

// GET /api/citations/by-author/:author - Get citations by author
router.get('/by-author/:author', citationsController.getCitationsByAuthor.bind(citationsController));

// GET /api/citations/by-doi/:doi - Get citation by DOI
router.get('/by-doi/:doi', citationsController.getCitationByDOI.bind(citationsController));

// GET /api/citations/search - Search citations (GET)
router.get('/search', citationsController.searchCitationsGet.bind(citationsController));

// POST /api/citations/search - Search citations (POST)
router.post('/search', citationsController.searchCitations.bind(citationsController));

// POST /api/citations/search/publication - Search citations with publication info
router.post('/search/publication', citationsController.searchWithPublicationInfo.bind(citationsController));

// GET /api/citations/:id - Get citation by ID
router.get('/:id', citationsController.getCitationById.bind(citationsController));

// POST /api/citations - Create new citation
router.post('/', citationsController.createCitation.bind(citationsController));

// PUT /api/citations/:id - Update citation
router.put('/:id', citationsController.updateCitation.bind(citationsController));

// DELETE /api/citations/:id - Delete citation
router.delete('/:id', citationsController.deleteCitation.bind(citationsController));

module.exports = router;
