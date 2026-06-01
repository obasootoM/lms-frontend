const express = require('express');

// ── Materials ─────────────────────────────────────────────────────────────────
const materialRouter = express.Router();
const mCtrl = require('../controllers/materialController');
const { protect, authorize } = require('../middleware/auth');

materialRouter.get(   '/:id',   protect, mCtrl.getMaterial);
materialRouter.put(   '/:id',   protect, authorize('lecturer'), mCtrl.updateMaterial);
materialRouter.delete('/:id',   protect, authorize('lecturer'), mCtrl.deleteMaterial);

// ── Assignments ───────────────────────────────────────────────────────────────
const assignmentRouter = express.Router();
const aCtrl = require('../controllers/assignmentController');
const { upload } = require('../config/cloudinary');

assignmentRouter.get( '/:id/submissions', protect, authorize('lecturer'), aCtrl.getSubmissions);
assignmentRouter.get( '/:id/my-submission', protect, authorize('student'), aCtrl.getMySubmission);
assignmentRouter.post('/:id/submit',
  protect, authorize('student'),
  (req, _res, next) => { req.uploadFolder = 'submissions'; next(); },
  upload.single('file'),
  aCtrl.submitAssignment
);
assignmentRouter.put('/:id/submissions/:submissionId/grade', protect, authorize('lecturer'), aCtrl.gradeSubmission);

// ── Publications ──────────────────────────────────────────────────────────────
const pubRouter = express.Router();
const pCtrl = require('../controllers/publicationController');

pubRouter.get( '/',    pCtrl.getPublications);
pubRouter.post('/',    protect, authorize('lecturer'), upload.single('file'), pCtrl.createPublication);
pubRouter.put( '/:id', protect, authorize('lecturer'), pCtrl.updatePublication);
pubRouter.delete('/:id', protect, authorize('lecturer'), pCtrl.deletePublication);
pubRouter.post('/:id/download', pCtrl.downloadPublication);

// ── Announcements ─────────────────────────────────────────────────────────────
const annRouter = express.Router();

annRouter.get( '/',    protect, pCtrl.getAnnouncements);
annRouter.post('/',    protect, authorize('lecturer'), pCtrl.createAnnouncement);
annRouter.put( '/:id', protect, authorize('lecturer'), pCtrl.updateAnnouncement);
annRouter.delete('/:id', protect, authorize('lecturer'), pCtrl.deleteAnnouncement);

// ── Notifications ─────────────────────────────────────────────────────────────
const notifRouter = express.Router();
notifRouter.get( '/',    protect, pCtrl.getNotifications);
notifRouter.put( '/read', protect, pCtrl.markRead);

// ── AI Tutor ──────────────────────────────────────────────────────────────────
const aiRouter = express.Router();
aiRouter.post('/chat', protect, pCtrl.aiTutorChat);

// ── Analytics ─────────────────────────────────────────────────────────────────
const analyticsRouter = express.Router();
const anlCtrl = require('../controllers/analyticsController');
analyticsRouter.get('/lecturer-dashboard', protect, authorize('lecturer'), anlCtrl.getLecturerDashboard);
analyticsRouter.get('/student-dashboard',  protect, authorize('student'),  anlCtrl.getStudentDashboard);
analyticsRouter.get('/courses/:courseId',  protect, authorize('lecturer'), anlCtrl.getCourseAnalytics);

module.exports = {
  materialRouter,
  assignmentRouter,
  pubRouter,
  annRouter,
  notifRouter,
  aiRouter,
  analyticsRouter,
};
