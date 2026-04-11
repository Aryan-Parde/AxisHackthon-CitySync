const express = require('express');
const router = express.Router();
const { getMapComplaints, getHeatmapData, getClusterData } = require('../controllers/mapController');
const { protect } = require('../middleware/auth');

// Map routes are public - anyone can view the city map

router.get('/complaints', getMapComplaints);
router.get('/heatmap', getHeatmapData);
router.get('/clusters', getClusterData);

module.exports = router;
