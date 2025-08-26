// backend/routes/statisticsRoutes.js
const express = require('express');
const router = express.Router();
const entriesController = require('../controllers/entriesControllerNew');

// Statistics endpoints
router.get('/entries', entriesController.getStatistics);

module.exports = router;
