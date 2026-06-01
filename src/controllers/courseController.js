const Course   = require('../models/Course');
const Material = require('../models/Material');

// ── Create course (lecturer) ──────────────────────────────────────────────────
exports.createCourse = async (req, res) => {
  const course = await Course.create({ ...req.body, lecturer: req.user._id });
  res.status(201).json({ success: true, course });
};

// ── Get all courses (public — no auth needed for listing) ─────────────────────
exports.getCourses = async (req, res) => {
  const filter = { isActive: true };
  if (req.query.session) filter.academicSession = req.query.session;
  if (req.query.semester) filter.semester = req.query.semester;

  const courses = await Course.find(filter)
    .populate('lecturer', 'fullName profilePhotoUrl')
    .sort({ courseCode: 1 });

  res.json({ success: true, count: courses.length, courses });
};

// ── Get single course ─────────────────────────────────────────────────────────
exports.getCourse = async (req, res) => {
  const course = await Course.findById(req.params.id)
    .populate('lecturer', 'fullName profilePhotoUrl bio')
    .populate('enrolledStudents', 'fullName email matricNumber');

  if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
  res.json({ success: true, course });
};

// ── Update course ─────────────────────────────────────────────────────────────
exports.updateCourse = async (req, res) => {
  const course = await Course.findOneAndUpdate(
    { _id: req.params.id, lecturer: req.user._id },
    req.body,
    { new: true, runValidators: true }
  );
  if (!course) return res.status(404).json({ success: false, message: 'Course not found or not authorised' });
  res.json({ success: true, course });
};

// ── Delete / archive course ───────────────────────────────────────────────────
exports.deleteCourse = async (req, res) => {
  const course = await Course.findOneAndUpdate(
    { _id: req.params.id, lecturer: req.user._id },
    { isActive: false },
    { new: true }
  );
  if (!course) return res.status(404).json({ success: false, message: 'Course not found or not authorised' });
  res.json({ success: true, message: 'Course archived successfully' });
};

// ── Enroll student ────────────────────────────────────────────────────────────
exports.enrollStudent = async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

  const studentId = req.user._id;
  if (course.enrolledStudents.includes(studentId)) {
    return res.status(409).json({ success: false, message: 'Already enrolled in this course' });
  }

  course.enrolledStudents.push(studentId);
  await course.save();
  res.json({ success: true, message: 'Enrolled successfully' });
};

// ── Unenroll student ──────────────────────────────────────────────────────────
exports.unenrollStudent = async (req, res) => {
  await Course.findByIdAndUpdate(req.params.id, {
    $pull: { enrolledStudents: req.user._id },
  });
  res.json({ success: true, message: 'Unenrolled successfully' });
};

// ── Get my enrolled courses (student) ────────────────────────────────────────
exports.getMyEnrolledCourses = async (req, res) => {
  const courses = await Course.find({
    enrolledStudents: req.user._id,
    isActive: true,
  }).populate('lecturer', 'fullName profilePhotoUrl');
  res.json({ success: true, count: courses.length, courses });
};

// ── Get my courses (lecturer) ─────────────────────────────────────────────────
exports.getMyCourses = async (req, res) => {
  const courses = await Course.find({ lecturer: req.user._id })
    .sort({ createdAt: -1 });
  res.json({ success: true, count: courses.length, courses });
};
