// backend/routes/ligandsRoutesNew.js
const express = require('express');
const router = express.Router();
const LigandsController = require('../controllers/ligandsControllerNew');

const ligandsController = new LigandsController();

// GET /api/ligands - Get all ligands
router.get('/', ligandsController.getAllLigands.bind(ligandsController));

// GET /api/ligands/statistics - Get ligand statistics
router.get('/statistics', ligandsController.getLigandStatistics.bind(ligandsController));

// GET /api/ligands/types - Get ligand types
router.get('/types', ligandsController.getLigandTypes.bind(ligandsController));

// GET /api/ligands/by-molecular-weight - Get ligands by molecular weight range
router.get('/by-molecular-weight', ligandsController.getLigandsByMolecularWeight.bind(ligandsController));

// GET /api/ligands/by-formula/:formula - Get ligands by chemical formula
router.get('/by-formula/:formula', ligandsController.getLigandsByFormula.bind(ligandsController));

// GET /api/ligands/search - Search ligands (GET)
router.get('/search', ligandsController.searchLigandsGet.bind(ligandsController));

// POST /api/ligands/search - Search ligands (POST)
router.post('/search', ligandsController.searchLigands.bind(ligandsController));

// POST /api/ligands/search/chemical - Search ligands with chemical properties
router.post('/search/chemical', ligandsController.searchWithChemicalProperties.bind(ligandsController));

// GET /api/ligands/:id - Get ligand by ID
router.get('/:id', ligandsController.getLigandById.bind(ligandsController));

// GET /api/ligands/:id/cooccurrences - Get ligand co-occurrences
router.get('/:id/cooccurrences', ligandsController.getLigandCooccurrences.bind(ligandsController));

// POST /api/ligands - Create new ligand
router.post('/', ligandsController.createLigand.bind(ligandsController));

// PUT /api/ligands/:id - Update ligand
router.put('/:id', ligandsController.updateLigand.bind(ligandsController));

// DELETE /api/ligands/:id - Delete ligand
router.delete('/:id', ligandsController.deleteLigand.bind(ligandsController));

module.exports = router;
