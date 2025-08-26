// backend/routes/organismsRoutes.js
const express = require('express');
const router = express.Router();
const organismsController = require('../controllers/organismsController');

router.get('/', organismsController.getAllOrganisms);
router.get('/:id', organismsController.getOrganismById);
router.post('/', organismsController.createOrganism);
router.put('/:id', organismsController.updateOrganism);
router.delete('/:id', organismsController.deleteOrganism);

// Junction table routes for entry_organisms
router.post('/relation', organismsController.addEntryOrganism); // Link an entry to an organism
router.delete('/relation/:pdb_id/:organism_id', organismsController.removeEntryOrganism); // Unlink
router.get('/entry/:pdb_id', organismsController.getOrganismsForEntry); // Get organisms for a specific entry

module.exports = router;