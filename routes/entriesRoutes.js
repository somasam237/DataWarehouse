// backend/routes/entriesRoutes.js
const express = require('express');
const router = express.Router();
const entriesController = require('../controllers/entriesController');
// const { protect } = require('../controllers/authController'); // If you want to protect these routes

router.get('/', entriesController.getAllEntries);
router.get('/:id', entriesController.getEntryById);
router.post('/', entriesController.createEntry); // Add `protect` here if needed: `router.post('/', protect, entriesController.createEntry);`
router.put('/:id', entriesController.updateEntry);
router.delete('/:id', entriesController.deleteEntry);

module.exports = router;