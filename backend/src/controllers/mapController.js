const Complaint = require('../models/Complaint');

// @desc    Get complaints as GeoJSON for map
// @route   GET /api/map/complaints
// @access  Private
exports.getMapComplaints = async (req, res, next) => {
  try {
    const { category, status, priority, bounds } = req.query;

    const query = { status: { $nin: ['closed'] } };
    if (category) query.category = category;
    if (status) query.status = status;
    if (priority) query['priority.level'] = priority;

    // If bounds provided, filter by bounding box
    if (bounds) {
      const [swLng, swLat, neLng, neLat] = bounds.split(',').map(Number);
      query.location = {
        $geoWithin: {
          $box: [[swLng, swLat], [neLng, neLat]]
        }
      };
    }

    const complaints = await Complaint.find(query)
      .select('ticketId title category priority status location duplicateCount createdAt upvotes')
      .limit(500);

    // Convert to GeoJSON FeatureCollection
    const geojson = {
      type: 'FeatureCollection',
      features: complaints.map(c => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: c.location.coordinates
        },
        properties: {
          id: c._id,
          ticketId: c.ticketId,
          title: c.title,
          category: c.category,
          priority: c.priority.level,
          priorityScore: c.priority.score,
          status: c.status,
          address: c.location.address,
          zone: c.location.zone,
          duplicateCount: c.duplicateCount,
          upvotes: c.upvotes,
          createdAt: c.createdAt
        }
      }))
    };

    res.status(200).json({ success: true, data: geojson });
  } catch (error) {
    next(error);
  }
};

// @desc    Get heatmap data
// @route   GET /api/map/heatmap
// @access  Private
exports.getHeatmapData = async (req, res, next) => {
  try {
    const { category, days = 30 } = req.query;
    const since = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000);

    const query = {
      createdAt: { $gte: since },
      status: { $nin: ['closed'] }
    };
    if (category) query.category = category;

    const complaints = await Complaint.find(query)
      .select('location.coordinates priority.score duplicateCount');

    // Return as GeoJSON with intensity weights
    const geojson = {
      type: 'FeatureCollection',
      features: complaints.map(c => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: c.location.coordinates
        },
        properties: {
          intensity: (c.priority.score / 100) * c.duplicateCount
        }
      }))
    };

    res.status(200).json({ success: true, data: geojson });
  } catch (error) {
    next(error);
  }
};

// @desc    Get cluster data
// @route   GET /api/map/clusters
// @access  Private
exports.getClusterData = async (req, res, next) => {
  try {
    const complaints = await Complaint.find({ status: { $nin: ['closed'] } })
      .select('location.coordinates category priority.level status ticketId title duplicateCount')
      .limit(1000);

    const geojson = {
      type: 'FeatureCollection',
      features: complaints.map(c => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: c.location.coordinates
        },
        properties: {
          ticketId: c.ticketId,
          title: c.title,
          category: c.category,
          priority: c.priority.level,
          status: c.status,
          duplicateCount: c.duplicateCount
        }
      }))
    };

    res.status(200).json({ success: true, data: geojson });
  } catch (error) {
    next(error);
  }
};
