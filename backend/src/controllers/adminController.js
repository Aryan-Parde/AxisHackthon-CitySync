const Complaint = require('../models/Complaint');
const Department = require('../models/Department');
const User = require('../models/User');
const Escalation = require('../models/Escalation');
const EscalationService = require('../services/escalationService');

// @desc    Get admin dashboard stats
// @route   GET /api/admin/dashboard
// @access  Private (admin)
exports.getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalComplaints,
      resolved,
      pending,
      inProgress,
      escalated,
      critical
    ] = await Promise.all([
      Complaint.countDocuments(),
      Complaint.countDocuments({ status: 'resolved' }),
      Complaint.countDocuments({ status: 'submitted' }),
      Complaint.countDocuments({ status: 'in_progress' }),
      Complaint.countDocuments({ status: 'escalated' }),
      Complaint.countDocuments({ 'priority.level': 'critical' })
    ]);

    // Average resolution time (for resolved complaints)
    const avgResolution = await Complaint.aggregate([
      { $match: { status: 'resolved', resolvedAt: { $exists: true } } },
      {
        $project: {
          resolutionTime: { $subtract: ['$resolvedAt', '$createdAt'] }
        }
      },
      {
        $group: {
          _id: null,
          avgTime: { $avg: '$resolutionTime' }
        }
      }
    ]);

    const avgResolutionHours = avgResolution.length > 0
      ? Math.round(avgResolution[0].avgTime / (1000 * 60 * 60) * 10) / 10
      : 0;

    // Category breakdown
    const categoryBreakdown = await Complaint.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Priority breakdown
    const priorityBreakdown = await Complaint.aggregate([
      { $group: { _id: '$priority.level', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Recent 7 days trend
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const dailyTrend = await Complaint.aggregate([
      { $match: { createdAt: { $gte: weekAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Zone breakdown
    const zoneBreakdown = await Complaint.aggregate([
      { $group: { _id: '$location.zone', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        overview: {
          total: totalComplaints,
          resolved,
          pending,
          inProgress,
          escalated,
          critical,
          resolutionRate: totalComplaints > 0
            ? Math.round((resolved / totalComplaints) * 100)
            : 0,
          avgResolutionHours
        },
        categoryBreakdown,
        priorityBreakdown,
        dailyTrend,
        zoneBreakdown
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all complaints with filters (admin)
// @route   GET /api/admin/complaints
// @access  Private (admin)
exports.getAllComplaints = async (req, res, next) => {
  try {
    const {
      status, category, priority, zone,
      search, page = 1, limit = 20,
      sortBy = 'createdAt', sortOrder = 'desc'
    } = req.query;

    const query = {};
    if (status) query.status = status;
    if (category) query.category = category;
    if (priority) query['priority.level'] = priority;
    if (zone) query['location.zone'] = zone;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { ticketId: { $regex: search, $options: 'i' } }
      ];
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const complaints = await Complaint.find(query)
      .populate('department', 'name code icon')
      .populate('citizen', 'name mobile')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Complaint.countDocuments(query);

    res.status(200).json({
      success: true,
      data: complaints,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get analytics data
// @route   GET /api/admin/analytics
// @access  Private (admin)
exports.getAnalytics = async (req, res, next) => {
  try {
    const { period = '30' } = req.query;
    const daysAgo = new Date(Date.now() - parseInt(period) * 24 * 60 * 60 * 1000);

    // Complaints over time
    const timeline = await Complaint.aggregate([
      { $match: { createdAt: { $gte: daysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          submitted: { $sum: 1 },
          resolved: {
            $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Department performance
    const deptPerformance = await Department.find()
      .select('name code totalComplaints resolvedComplaints avgResolutionHours performanceScore icon')
      .sort({ performanceScore: -1 });

    // Top hotspots (locations with most complaints)
    const hotspots = await Complaint.aggregate([
      { $match: { createdAt: { $gte: daysAgo } } },
      {
        $group: {
          _id: '$location.address',
          count: { $sum: 1 },
          coordinates: { $first: '$location.coordinates' },
          zone: { $first: '$location.zone' },
          categories: { $addToSet: '$category' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Escalation stats
    const escalationStats = await Escalation.aggregate([
      {
        $group: {
          _id: '$toLevel',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.status(200).json({
      success: true,
      data: { timeline, deptPerformance, hotspots, escalationStats }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get department stats
// @route   GET /api/admin/departments
// @access  Private (admin)
exports.getDepartments = async (req, res, next) => {
  try {
    const departments = await Department.find().sort({ name: 1 });

    // Enrich with live complaint counts
    const enriched = await Promise.all(departments.map(async (dept) => {
      const [total, pending, resolved] = await Promise.all([
        Complaint.countDocuments({ department: dept._id }),
        Complaint.countDocuments({ department: dept._id, status: { $in: ['submitted', 'under_review'] } }),
        Complaint.countDocuments({ department: dept._id, status: 'resolved' })
      ]);

      return {
        ...dept.toObject(),
        liveStats: { total, pending, resolved, resolutionRate: total > 0 ? Math.round((resolved / total) * 100) : 0 }
      };
    }));

    res.status(200).json({ success: true, data: enriched });
  } catch (error) {
    next(error);
  }
};

// @desc    Manually escalate complaint
// @route   POST /api/admin/escalate/:id
// @access  Private (admin)
exports.escalateComplaint = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const escalation = await EscalationService.manualEscalate(req.params.id, reason);

    res.status(200).json({
      success: true,
      message: 'Complaint escalated',
      data: escalation
    });
  } catch (error) {
    next(error);
  }
};
