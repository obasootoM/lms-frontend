const { Assignment, Submission } = require('../models/Assignment');
const Course = require('../models/Course');
const { Notification } = require('../models/Publication');

// ── Create assignment (lecturer) ──────────────────────────────────────────────
exports.createAssignment = async (req, res) => {
  const course = await Course.findOne({ _id: req.params.courseId, lecturer: req.user._id });
  if (!course) return res.status(403).json({ success: false, message: 'Not authorised' });

  const assignment = await Assignment.create({
    ...req.body,
    course:    course._id,
    createdBy: req.user._id,
    fileUrl:   req.file ? req.file.path : undefined,
  });

  // Notify students
  const notifications = course.enrolledStudents.map((sid) => ({
    recipient: sid,
    title:     `New Assignment: ${assignment.title}`,
    message:   `Due: ${new Date(assignment.dueDate).toLocaleDateString()}`,
    type:      'assignment',
    link:      `/courses/${course._id}/assignments/${assignment._id}`,
  }));
  if (notifications.length) await Notification.insertMany(notifications);

  res.status(201).json({ success: true, assignment });
};

// ── Get assignments for a course ──────────────────────────────────────────────
exports.getAssignments = async (req, res) => {
  const assignments = await Assignment.find({
    course:    req.params.courseId,
    isVisible: true,
  }).sort({ dueDate: 1 });
  res.json({ success: true, count: assignments.length, assignments });
};

// ── Submit assignment (student) ───────────────────────────────────────────────
exports.submitAssignment = async (req, res) => {
  const assignment = await Assignment.findById(req.params.id).populate('course');
  if (!assignment) return res.status(404).json({ success: false, message: 'Assignment not found' });

  const isEnrolled = assignment.course.enrolledStudents.some((s) => s.equals(req.user._id));
  if (!isEnrolled) return res.status(403).json({ success: false, message: 'Not enrolled in this course' });

  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

  const isLate = new Date() > new Date(assignment.dueDate);

  const submission = await Submission.findOneAndUpdate(
    { assignment: assignment._id, student: req.user._id },
    {
      fileUrl:     req.file.path,
      publicId:    req.file.filename,
      fileName:    req.file.originalname,
      submittedAt: new Date(),
      isLate,
    },
    { upsert: true, new: true, runValidators: true }
  );

  res.status(201).json({ success: true, submission, isLate });
};

// ── Get submissions for an assignment (lecturer) ──────────────────────────────
exports.getSubmissions = async (req, res) => {
  const assignment = await Assignment.findOne({
    _id:       req.params.id,
    createdBy: req.user._id,
  });
  if (!assignment) return res.status(403).json({ success: false, message: 'Not authorised' });

  const submissions = await Submission.find({ assignment: assignment._id })
    .populate('student', 'fullName email matricNumber')
    .sort({ submittedAt: 1 });

  res.json({ success: true, count: submissions.length, submissions });
};

// ── Grade submission (lecturer) ───────────────────────────────────────────────
exports.gradeSubmission = async (req, res) => {
  const { score, feedback } = req.body;

  const submission = await Submission.findByIdAndUpdate(
    req.params.submissionId,
    { score, feedback, gradedAt: new Date(), gradedBy: req.user._id },
    { new: true }
  ).populate('student', 'fullName email');

  if (!submission) return res.status(404).json({ success: false, message: 'Submission not found' });

  // Notify student
  await Notification.create({
    recipient: submission.student._id,
    title:     'Assignment graded',
    message:   `Your submission received ${score} marks`,
    type:      'grade',
  });

  res.json({ success: true, submission });
};

// ── My submission (student) ───────────────────────────────────────────────────
exports.getMySubmission = async (req, res) => {
  const submission = await Submission.findOne({
    assignment: req.params.id,
    student:    req.user._id,
  });
  res.json({ success: true, submission: submission || null });
};
