const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getAllComplaints,
  getAnalytics,
  getDepartments,
  escalateComplaint
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

// Public routes for hackathon demo
router.get('/dashboard', getDashboardStats);
router.get('/complaints', getAllComplaints);
router.get('/analytics', getAnalytics);
router.get('/departments', getDepartments);

// Protected routes
router.post('/escalate/:id', protect, authorize('admin'), escalateComplaint);

module.exports = router;
