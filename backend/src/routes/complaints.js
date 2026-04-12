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
  reassignComplaint,
  validateGeotag,
  getResolvedComplaints,
  appealComplaint,
  getAppeals,
  reviewAppeal
} = require('../controllers/complaintController');
const { protect, authorize } = require('../middleware/auth');

// Public route — resolved complaints for citizens
router.get('/resolved', getResolvedComplaints);

router.use(protect); // All other complaint routes require auth

router.post('/validate-geotag', validateGeotag);
router.get('/appeals', authorize('admin'), getAppeals);
router.post('/', createComplaint);
router.get('/', getMyComplaints);
router.get('/nearby', getNearbyComplaints);
router.get('/:id', getComplaint);
router.put('/:id/status', authorize('admin', 'authority'), updateStatus);
router.put('/:id/resolve', authorize('admin', 'authority'), resolveComplaint);
router.put('/:id/reassign', authorize('admin'), reassignComplaint);
router.post('/:id/upvote', upvoteComplaint);
router.post('/:id/appeal', appealComplaint);
router.put('/:id/appeal-review', authorize('admin'), reviewAppeal);

module.exports = router;
