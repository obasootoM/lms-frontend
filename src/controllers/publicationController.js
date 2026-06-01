const { Publication, Announcement, Notification } = require('../models/Publication');
const Course = require('../models/Course');
const axios  = require('axios');

// ══════════════════════════════════════════════════════════════════════════════
//  PUBLICATIONS
// ══════════════════════════════════════════════════════════════════════════════

exports.createPublication = async (req, res) => {
  const pub = await Publication.create({
    ...req.body,
    author:  req.user._id,
    fileUrl: req.file ? req.file.path : undefined,
    publicId: req.file ? req.file.filename : undefined,
  });
  res.status(201).json({ success: true, publication: pub });
};

exports.getPublications = async (req, res) => {
  const filter = { isPublished: true };
  if (req.query.type) filter.type = req.query.type;
  if (req.query.year) filter.year = Number(req.query.year);

  const pubs = await Publication.find(filter)
    .populate('author', 'fullName')
    .sort({ year: -1, createdAt: -1 });
  res.json({ success: true, count: pubs.length, publications: pubs });
};

exports.downloadPublication = async (req, res) => {
  await Publication.findByIdAndUpdate(req.params.id, { $inc: { downloadCount: 1 } });
  res.json({ success: true });
};

exports.updatePublication = async (req, res) => {
  const pub = await Publication.findOneAndUpdate(
    { _id: req.params.id, author: req.user._id },
    req.body, { new: true }
  );
  if (!pub) return res.status(404).json({ success: false, message: 'Not found or not authorised' });
  res.json({ success: true, publication: pub });
};

exports.deletePublication = async (req, res) => {
  await Publication.findOneAndDelete({ _id: req.params.id, author: req.user._id });
  res.json({ success: true, message: 'Publication deleted' });
};

// ══════════════════════════════════════════════════════════════════════════════
//  ANNOUNCEMENTS
// ══════════════════════════════════════════════════════════════════════════════

exports.createAnnouncement = async (req, res) => {
  const ann = await Announcement.create({ ...req.body, author: req.user._id });

  // Notify relevant students
  let studentIds = [];
  if (ann.course) {
    const course = await Course.findById(ann.course).select('enrolledStudents');
    studentIds = course ? course.enrolledStudents : [];
  }
  // If no course, a global announcement — could notify all students (omitted for brevity)

  if (studentIds.length) {
    await Notification.insertMany(
      studentIds.map((sid) => ({
        recipient: sid,
        title:     `Announcement: ${ann.title}`,
        message:   ann.body.substring(0, 120),
        type:      'announcement',
        link:      `/announcements/${ann._id}`,
      }))
    );
  }

  res.status(201).json({ success: true, announcement: ann });
};

exports.getAnnouncements = async (req, res) => {
  const filter = {};
  if (req.query.course) filter.course = req.query.course;

  const announcements = await Announcement.find(filter)
    .populate('author', 'fullName')
    .populate('course', 'courseCode courseTitle')
    .sort({ isPinned: -1, createdAt: -1 });
  res.json({ success: true, count: announcements.length, announcements });
};

exports.updateAnnouncement = async (req, res) => {
  const ann = await Announcement.findOneAndUpdate(
    { _id: req.params.id, author: req.user._id },
    req.body, { new: true }
  );
  if (!ann) return res.status(404).json({ success: false, message: 'Not found or not authorised' });
  res.json({ success: true, announcement: ann });
};

exports.deleteAnnouncement = async (req, res) => {
  await Announcement.findOneAndDelete({ _id: req.params.id, author: req.user._id });
  res.json({ success: true, message: 'Announcement deleted' });
};

// ══════════════════════════════════════════════════════════════════════════════
//  NOTIFICATIONS
// ══════════════════════════════════════════════════════════════════════════════

exports.getNotifications = async (req, res) => {
  const notifications = await Notification.find({ recipient: req.user._id })
    .sort({ createdAt: -1 })
    .limit(50);
  const unreadCount = await Notification.countDocuments({ recipient: req.user._id, isRead: false });
  res.json({ success: true, unreadCount, notifications });
};

exports.markRead = async (req, res) => {
  await Notification.updateMany(
    { recipient: req.user._id, isRead: false },
    { isRead: true }
  );
  res.json({ success: true, message: 'All notifications marked as read' });
};

// ══════════════════════════════════════════════════════════════════════════════
//  AI TUTOR PROXY
// ══════════════════════════════════════════════════════════════════════════════

exports.aiTutorChat = async (req, res) => {
  const { message, sessionId, courseContext } = req.body;

  if (!message) return res.status(400).json({ success: false, message: 'Message is required' });

  const aiApiUrl = process.env.AI_TUTOR_API_URL;
  const aiApiKey = process.env.AI_TUTOR_API_KEY;

  // If AI Tutor API is not configured, return placeholder response
  if (!aiApiUrl) {
    return res.json({
      success: true,
      response: "The AI Tutor is not yet configured. Please contact your lecturer. This interface will connect to an intelligent tutoring system when available.",
      sessionId: sessionId || `session_${Date.now()}`,
      isPlaceholder: true,
    });
  }

  try {
    const aiResponse = await axios.post(
      `${aiApiUrl}/chat`,
      { message, sessionId, courseContext },
      { headers: { Authorization: `Bearer ${aiApiKey}`, 'Content-Type': 'application/json' }, timeout: 30000 }
    );

    res.json({ success: true, response: aiResponse.data.response, sessionId: aiResponse.data.sessionId });
  } catch (err) {
    console.error('AI Tutor API error:', err.message);
    res.status(503).json({
      success: false,
      message: 'AI Tutor is temporarily unavailable. Please try again later.',
    });
  }
};
