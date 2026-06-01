const Material = require('../models/Material');
const Course   = require('../models/Course');
const { Notification } = require('../models/Publication');

// ── Upload material (lecturer) ────────────────────────────────────────────────
exports.uploadMaterial = async (req, res) => {
  const course = await Course.findOne({ _id: req.params.courseId, lecturer: req.user._id });
  if (!course) return res.status(403).json({ success: false, message: 'Not authorised or course not found' });

  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

  const material = await Material.create({
    course:      course._id,
    uploadedBy:  req.user._id,
    title:       req.body.title || req.file.originalname,
    description: req.body.description,
    category:    req.body.category,
    week:        req.body.week,
    fileUrl:     req.file.path,
    publicId:    req.file.filename,
    fileName:    req.file.originalname,
    fileSize:    req.file.size,
    mimeType:    req.file.mimetype,
  });

  // Notify enrolled students
  const notifications = course.enrolledStudents.map((studentId) => ({
    recipient: studentId,
    title:     `New material: ${material.title}`,
    message:   `New ${material.category.replace('_', ' ')} uploaded for ${course.courseCode}`,
    type:      'material',
    link:      `/courses/${course._id}/materials`,
  }));
  if (notifications.length) await Notification.insertMany(notifications);

  res.status(201).json({ success: true, material });
};

// ── Get materials for a course ────────────────────────────────────────────────
exports.getMaterials = async (req, res) => {
  const course = await Course.findById(req.params.courseId);
  if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

  // Students must be enrolled; lecturer must own the course
  const isLecturer = req.user.role === 'lecturer' && course.lecturer.equals(req.user._id);
  const isEnrolled = course.enrolledStudents.some((s) => s.equals(req.user._id));

  if (!isLecturer && !isEnrolled) {
    return res.status(403).json({ success: false, message: 'Not enrolled in this course' });
  }

  const filter = { course: course._id };
  if (!isLecturer) filter.isVisible = true; // hide invisible materials from students
  if (req.query.category) filter.category = req.query.category;

  const materials = await Material.find(filter).sort({ createdAt: -1 });
  res.json({ success: true, count: materials.length, materials });
};

// ── Get single material + increment download count ────────────────────────────
exports.getMaterial = async (req, res) => {
  const material = await Material.findByIdAndUpdate(
    req.params.id,
    { $inc: { downloadCount: 1 } },
    { new: true }
  ).populate('course', 'courseCode courseTitle');

  if (!material) return res.status(404).json({ success: false, message: 'Material not found' });
  res.json({ success: true, material });
};

// ── Update material metadata ──────────────────────────────────────────────────
exports.updateMaterial = async (req, res) => {
  const material = await Material.findOneAndUpdate(
    { _id: req.params.id, uploadedBy: req.user._id },
    { title: req.body.title, description: req.body.description, isVisible: req.body.isVisible, week: req.body.week },
    { new: true }
  );
  if (!material) return res.status(404).json({ success: false, message: 'Material not found or not authorised' });
  res.json({ success: true, material });
};

// ── Delete material ───────────────────────────────────────────────────────────
exports.deleteMaterial = async (req, res) => {
  const { cloudinary } = require('../config/cloudinary');
  const material = await Material.findOne({ _id: req.params.id, uploadedBy: req.user._id });
  if (!material) return res.status(404).json({ success: false, message: 'Material not found or not authorised' });

  if (material.publicId) {
    await cloudinary.uploader.destroy(material.publicId, { resource_type: 'raw' }).catch(console.error);
  }
  await material.deleteOne();
  res.json({ success: true, message: 'Material deleted' });
};
