// backend/routes/entriesRoutesNew.js
const express = require('express');
const router = express.Router();
const entriesController = require('../controllers/entriesControllerNew');

// Basic CRUD operations
router.get('/', entriesController.getAllEntries);
router.get('/summary', entriesController.getEntriesSummary);
router.post('/', entriesController.createEntry);

// Statistics route (must be before /:id)
router.get('/api/stats', entriesController.getStatistics);

// ID-based routes
router.get('/:id', entriesController.getEntryById);
router.put('/:id', entriesController.updateEntry);
router.delete('/:id', entriesController.deleteEntry);

// Favorites operations
router.post('/:id/favorites', entriesController.addToFavorites);
router.delete('/:id/favorites', entriesController.removeFromFavorites);
router.get('/users/:user_id/favorites', entriesController.getUserFavorites);

module.exports = router;
