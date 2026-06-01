const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema(
  {
    lecturer:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    courseCode:     { type: String, required: true, uppercase: true, trim: true },
    courseTitle:    { type: String, required: true, trim: true },
    description:    { type: String },
    creditUnits:    { type: Number, required: true, min: 1, max: 6 },
    semester:       { type: String, enum: ['first', 'second'], required: true },
    academicSession:{ type: String, required: true }, // e.g. "2024/2025"
    objectives:     [{ type: String }],
    weeklyTopics:   [{ week: Number, topic: String }],
    textbooks:      [{ title: String, author: String, edition: String }],
    isActive:       { type: Boolean, default: true },
    enrolledStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

// Compound unique index: one course code per session
courseSchema.index({ courseCode: 1, academicSession: 1 }, { unique: true });

module.exports = mongoose.model('Course', courseSchema);
