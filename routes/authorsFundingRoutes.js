// backend/routes/authorsFundingRoutes.js
const express = require('express');
const AuthorsFundingController = require('../controllers/AuthorsFundingController');

const router = express.Router();
const authorsFundingController = new AuthorsFundingController();

// Basic CRUD operations
router.get('/', authorsFundingController.getAllAuthorsFunding.bind(authorsFundingController));
router.get('/statistics', authorsFundingController.getFundingStatistics.bind(authorsFundingController));
router.get('/top-funding-organizations', authorsFundingController.getTopFundingOrganizations.bind(authorsFundingController));
router.get('/funding-by-location', authorsFundingController.getFundingByLocation.bind(authorsFundingController));
router.get('/author-collaborations', authorsFundingController.getAuthorCollaborations.bind(authorsFundingController));
router.get('/top-authors', authorsFundingController.getTopAuthors.bind(authorsFundingController));
router.get('/search/author', authorsFundingController.searchByAuthor.bind(authorsFundingController));
router.get('/search/funding', authorsFundingController.searchByFunding.bind(authorsFundingController));
router.get('/by-pdb/:pdb_id', authorsFundingController.getByPdbId.bind(authorsFundingController));
router.get('/:id', authorsFundingController.getAuthorsFundingById.bind(authorsFundingController));

router.post('/', authorsFundingController.createAuthorsFunding.bind(authorsFundingController));

router.put('/:id', authorsFundingController.updateAuthorsFunding.bind(authorsFundingController));
router.delete('/:id', authorsFundingController.deleteAuthorsFunding.bind(authorsFundingController));

module.exports = router;
