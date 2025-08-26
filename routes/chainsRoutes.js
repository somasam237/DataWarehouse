// backend/routes/chainsRoutes.js
const express = require('express');
const router = express.Router();
const chainsController = require('../controllers/chainsController');

router.get('/', chainsController.getAllChains); // Optionally add query param for pdb_id: /api/chains?pdb_id=4HHB
router.get('/:id', chainsController.getChainById); // get by chain_id (SERIAL PRIMARY KEY)
router.post('/', chainsController.createChain);
router.put('/:id', chainsController.updateChain);
router.delete('/:id', chainsController.deleteChain);

module.exports = router;