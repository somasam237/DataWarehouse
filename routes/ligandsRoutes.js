// backend/routes/ligandsRoutes.js
const express = require('express');
const router = express.Router();
const ligandsController = require('../controllers/ligandsController');

router.get('/', ligandsController.getAllLigands); // Optionally add query param for pdb_id: /api/ligands?pdb_id=4HHB
router.get('/:id', ligandsController.getLigandById);
router.post('/', ligandsController.createLigand);
router.put('/:id', ligandsController.updateLigand);
router.delete('/:id', ligandsController.deleteLigand);

module.exports = router;