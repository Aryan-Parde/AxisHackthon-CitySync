const express = require('express');
const router = express.Router();
const {
  createComplaint,
  getMyComplaints,
  getComplaint,
  getNearbyComplaints,
  updateStatus,
  upvoteComplaint,
  resolveComplaint,
  reassignComplaint
} = require('../controllers/complaintController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect); // All complaint routes require auth

router.post('/', createComplaint);
router.get('/', getMyComplaints);
router.get('/nearby', getNearbyComplaints);
router.get('/:id', getComplaint);
router.put('/:id/status', authorize('admin', 'authority'), updateStatus);
router.put('/:id/resolve', authorize('admin', 'authority'), resolveComplaint);
router.put('/:id/reassign', authorize('admin'), reassignComplaint);
router.post('/:id/upvote', upvoteComplaint);

module.exports = router;
