const express = require('express');
const router = express.Router();
const { getStatus, getStats } = require('../controllers/AppController');



//get status
router.get('/status', getStatus);


//get stats
router.get('/stats', getStats);


module.exports = router;

