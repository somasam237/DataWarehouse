// backend/routes/citationsRoutes.js
const express = require('express');
const router = express.Router();
const citationsController = require('../controllers/citationsController');

router.get('/', citationsController.getAllCitations);
router.get('/:id', citationsController.getCitationById);
router.post('/', citationsController.createCitation);
router.put('/:id', citationsController.updateCitation);
router.delete('/:id', citationsController.deleteCitation);

// Junction table routes for entry_citations
router.post('/relation', citationsController.addEntryCitation); // Link an entry to a citation
router.delete('/relation/:pdb_id/:citation_id', citationsController.removeEntryCitation); // Unlink
router.get('/entry/:pdb_id', citationsController.getCitationsForEntry); // Get citations for a specific entry

module.exports = router;