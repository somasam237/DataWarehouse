// backend/routes/ligandsNewRoutes.js
const express = require('express');
const LigandsNewController = require('../controllers/LigandsNewController');

const router = express.Router();
const ligandsNewController = new LigandsNewController();

// Basic CRUD operations
router.get('/', ligandsNewController.getAllLigands.bind(ligandsNewController));
router.get('/statistics', ligandsNewController.getLigandStatistics.bind(ligandsNewController));
router.get('/top-ligands', ligandsNewController.getTopLigands.bind(ligandsNewController));
router.get('/top-chemical-formulas', ligandsNewController.getTopChemicalFormulas.bind(ligandsNewController));
router.get('/chain-binding-patterns', ligandsNewController.getChainBindingPatterns.bind(ligandsNewController));
router.get('/proteins-with-multiple-ligands', ligandsNewController.getProteinsWithMultipleLigands.bind(ligandsNewController));
router.get('/ligand-protein-network', ligandsNewController.getLigandProteinNetwork.bind(ligandsNewController));
router.get('/search/ligand-name', ligandsNewController.searchByLigandName.bind(ligandsNewController));
router.get('/search/chemical-formula', ligandsNewController.searchByChemicalFormula.bind(ligandsNewController));
router.get('/search/inchi-key', ligandsNewController.searchByInchiKey.bind(ligandsNewController));
router.get('/search/bound-chains', ligandsNewController.searchByBoundChains.bind(ligandsNewController));
router.get('/by-pdb/:pdb_id', ligandsNewController.getByPdbId.bind(ligandsNewController));
router.get('/by-pdb-ligand/:pdb_id/:ligand_id', ligandsNewController.getByPdbIdAndLigandId.bind(ligandsNewController));
router.get('/:id', ligandsNewController.getLigandById.bind(ligandsNewController));

router.post('/', ligandsNewController.createLigand.bind(ligandsNewController));
router.post('/advanced-search', ligandsNewController.advancedSearch.bind(ligandsNewController));

router.put('/:id', ligandsNewController.updateLigand.bind(ligandsNewController));
router.delete('/:id', ligandsNewController.deleteLigand.bind(ligandsNewController));

module.exports = router;
