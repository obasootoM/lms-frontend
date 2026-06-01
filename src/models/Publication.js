const mongoose = require('mongoose');

// ── Publication ───────────────────────────────────────────────────────────────
const publicationSchema = new mongoose.Schema(
  {
    author:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title:       { type: String, required: true, trim: true },
    abstract:    { type: String },
    type:        {
      type: String,
      enum: ['journal_article', 'conference_paper', 'book_chapter', 'research_report', 'thesis'],
      required: true,
    },
    journal:     { type: String }, // journal or conference name
    year:        { type: Number, required: true },
    authors:     [{ type: String }], // co-authors list
    doi:         { type: String },
    fileUrl:     { type: String },
    publicId:    { type: String },
    isPublished: { type: Boolean, default: true },
    downloadCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// ── Announcement ──────────────────────────────────────────────────────────────
const announcementSchema = new mongoose.Schema(
  {
    author:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    course:    { type: mongoose.Schema.Types.ObjectId, ref: 'Course' }, // null = all students
    title:     { type: String, required: true, trim: true },
    body:      { type: String, required: true },
    isPinned:  { type: Boolean, default: false },
    expiresAt: { type: Date },
  },
  { timestamps: true }
);

// ── Notification ──────────────────────────────────────────────────────────────
const notificationSchema = new mongoose.Schema(
  {
    recipient:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title:      { type: String, required: true },
    message:    { type: String, required: true },
    type:       {
      type: String,
      enum: ['material', 'assignment', 'announcement', 'submission', 'grade', 'system'],
      default: 'system',
    },
    link:       { type: String }, // frontend route
    isRead:     { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Publication  = mongoose.model('Publication', publicationSchema);
const Announcement = mongoose.model('Announcement', announcementSchema);
const Notification = mongoose.model('Notification', notificationSchema);

module.exports = { Publication, Announcement, Notification };
