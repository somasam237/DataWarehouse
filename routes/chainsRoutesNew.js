// backend/routes/chainsRoutesNew.js
const express = require('express');
const router = express.Router();
const chainsController = require('../controllers/chainsControllerNew');

// Basic CRUD operations
router.get('/', chainsController.getAllChains);
router.get('/statistics', chainsController.getStatistics);
router.get('/:id', chainsController.getChainById);
router.post('/', chainsController.createChain);
router.put('/:id', chainsController.updateChain);
router.delete('/:id', chainsController.deleteChain);

// Entry-specific chains
router.get('/entry/:pdb_id', chainsController.getChainsByEntry);

// Chain analysis
router.get('/:id/composition', chainsController.getAminoAcidComposition);
router.get('/:id/similar', chainsController.findSimilarChains);

// Relationship management
router.put('/:id/organism', chainsController.updateChainOrganism);

module.exports = router;
