const Course       = require('../models/Course');
const Material     = require('../models/Material');
const { Assignment, Submission } = require('../models/Assignment');
const User         = require('../models/User');

// ── Lecturer dashboard overview ───────────────────────────────────────────────
exports.getLecturerDashboard = async (req, res) => {
  const lecturerId = req.user._id;

  const [courses, totalStudents, recentMaterials] = await Promise.all([
    Course.find({ lecturer: lecturerId, isActive: true }),
    Course.aggregate([
      { $match: { lecturer: lecturerId, isActive: true } },
      { $unwind: '$enrolledStudents' },
      { $group: { _id: '$enrolledStudents' } },
      { $count: 'total' },
    ]),
    Material.find({ uploadedBy: lecturerId }).sort({ createdAt: -1 }).limit(5)
      .populate('course', 'courseCode'),
  ]);

  res.json({
    success: true,
    stats: {
      totalCourses:  courses.length,
      totalStudents: totalStudents[0]?.total || 0,
      recentMaterials,
    },
  });
};

// ── Course analytics ──────────────────────────────────────────────────────────
exports.getCourseAnalytics = async (req, res) => {
  const course = await Course.findOne({ _id: req.params.courseId, lecturer: req.user._id });
  if (!course) return res.status(403).json({ success: false, message: 'Not authorised' });

  const assignments = await Assignment.find({ course: course._id });
  const assignmentIds = assignments.map((a) => a._id);

  const [submissions, enrolledCount] = await Promise.all([
    Submission.find({ assignment: { $in: assignmentIds } }),
    Promise.resolve(course.enrolledStudents.length),
  ]);

  // Average score per assignment
  const assignmentStats = assignments.map((a) => {
    const subs = submissions.filter((s) => s.assignment.equals(a._id) && s.score != null);
    const avg  = subs.length ? subs.reduce((acc, s) => acc + s.score, 0) / subs.length : 0;
    return {
      assignmentId:   a._id,
      title:          a.title,
      submissionCount: submissions.filter((s) => s.assignment.equals(a._id)).length,
      averageScore:   Math.round(avg * 10) / 10,
      passRate:       subs.length
        ? Math.round((subs.filter((s) => s.score >= 40).length / subs.length) * 100)
        : 0,
    };
  });

  // Material download stats
  const materials = await Material.find({ course: course._id }).select('title category downloadCount');

  res.json({
    success: true,
    analytics: {
      courseCode:     course.courseCode,
      enrolledCount,
      assignmentStats,
      materialStats:  materials,
      overallPassRate: assignmentStats.length
        ? Math.round(assignmentStats.reduce((s, a) => s + a.passRate, 0) / assignmentStats.length)
        : 0,
    },
  });
};

// ── Student dashboard overview ────────────────────────────────────────────────
exports.getStudentDashboard = async (req, res) => {
  const courses = await Course.find({
    enrolledStudents: req.user._id,
    isActive: true,
  }).populate('lecturer', 'fullName');

  const courseIds = courses.map((c) => c._id);
  const assignments = await Assignment.find({ course: { $in: courseIds }, isVisible: true })
    .sort({ dueDate: 1 })
    .limit(10);

  const mySubmissions = await Submission.find({
    student:    req.user._id,
    assignment: { $in: assignments.map((a) => a._id) },
  });

  const upcomingAssignments = assignments
    .filter((a) => new Date(a.dueDate) > new Date())
    .map((a) => ({
      ...a.toObject(),
      submitted: mySubmissions.some((s) => s.assignment.equals(a._id)),
    }));

  res.json({
    success: true,
    stats: {
      enrolledCourses:     courses.length,
      upcomingAssignments,
      submittedCount:      mySubmissions.length,
    },
  });
};
