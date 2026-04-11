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

router.use(protect);

// Allow all authenticated users to view dashboard and analytics for hackathon demo
router.get('/dashboard', getDashboardStats);
router.get('/complaints', getAllComplaints);
router.get('/analytics', getAnalytics);
router.get('/departments', getDepartments);
router.post('/escalate/:id', authorize('admin'), escalateComplaint);

module.exports = router;
