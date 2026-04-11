const express = require('express');
const router = express.Router();
const { getMapComplaints, getHeatmapData, getClusterData } = require('../controllers/mapController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/complaints', getMapComplaints);
router.get('/heatmap', getHeatmapData);
router.get('/clusters', getClusterData);

module.exports = router;
