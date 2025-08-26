// backend/routes/macromoleculeRoutes.js
const express = require('express');
const MacromoleculeController = require('../controllers/MacromoleculeController');

const router = express.Router();
const macromoleculeController = new MacromoleculeController();

// Basic CRUD operations
router.get('/', macromoleculeController.getAllMacromolecules.bind(macromoleculeController));
router.get('/statistics', macromoleculeController.getMacromoleculeStatistics.bind(macromoleculeController));
router.get('/sequence-length-distribution', macromoleculeController.getSequenceLengthDistribution.bind(macromoleculeController));
router.get('/top-molecule-names', macromoleculeController.getTopMoleculeNames.bind(macromoleculeController));
router.get('/chain-composition', macromoleculeController.getChainComposition.bind(macromoleculeController));
router.get('/multi-entity-proteins', macromoleculeController.getMultiEntityProteins.bind(macromoleculeController));
router.get('/by-sequence-length', macromoleculeController.getBySequenceLengthRange.bind(macromoleculeController));
router.get('/search/molecule-name', macromoleculeController.searchByMoleculeName.bind(macromoleculeController));
router.get('/by-pdb/:pdb_id', macromoleculeController.getByPdbId.bind(macromoleculeController));
router.get('/by-pdb-entity/:pdb_id/:entity_id', macromoleculeController.getByPdbIdAndEntity.bind(macromoleculeController));
router.get('/:id', macromoleculeController.getMacromoleculeById.bind(macromoleculeController));

router.post('/', macromoleculeController.createMacromolecule.bind(macromoleculeController));
router.post('/advanced-search', macromoleculeController.advancedSearch.bind(macromoleculeController));

router.put('/:id', macromoleculeController.updateMacromolecule.bind(macromoleculeController));
router.delete('/:id', macromoleculeController.deleteMacromolecule.bind(macromoleculeController));

module.exports = router;
