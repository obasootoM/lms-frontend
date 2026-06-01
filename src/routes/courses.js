const express  = require('express');
const router   = express.Router();
const ctrl     = require('../controllers/courseController');
const mCtrl    = require('../controllers/materialController');
const aCtrl    = require('../controllers/assignmentController');
const { protect, authorize } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');

// Course CRUD
router.get(  '/',                              ctrl.getCourses);
router.post( '/',            protect, authorize('lecturer'), ctrl.createCourse);
router.get(  '/my-courses',  protect, authorize('lecturer'), ctrl.getMyCourses);
router.get(  '/enrolled',    protect, authorize('student'),  ctrl.getMyEnrolledCourses);
router.get(  '/:id',                          ctrl.getCourse);
router.put(  '/:id',         protect, authorize('lecturer'), ctrl.updateCourse);
router.delete('/:id',        protect, authorize('lecturer'), ctrl.deleteCourse);

// Enrollment
router.post('/:id/enroll',   protect, authorize('student'),  ctrl.enrollStudent);
router.delete('/:id/enroll', protect, authorize('student'),  ctrl.unenrollStudent);

// Materials (nested under course)
router.post('/:courseId/materials',
  protect, authorize('lecturer'),
  (req, _res, next) => { req.uploadFolder = 'materials'; next(); },
  upload.single('file'),
  mCtrl.uploadMaterial
);
router.get('/:courseId/materials', protect, mCtrl.getMaterials);

// Assignments (nested under course)
router.post('/:courseId/assignments',
  protect, authorize('lecturer'),
  upload.single('file'),
  aCtrl.createAssignment
);
router.get('/:courseId/assignments', protect, aCtrl.getAssignments);

module.exports = router;
