const mongoose = require('mongoose');

// ── Assignment ────────────────────────────────────────────────────────────────
const assignmentSchema = new mongoose.Schema(
  {
    course:       { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    createdBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title:        { type: String, required: true, trim: true },
    instructions: { type: String, required: true },
    dueDate:      { type: Date, required: true },
    totalMarks:   { type: Number, default: 100 },
    fileUrl:      { type: String }, // optional brief attachment
    isVisible:    { type: Boolean, default: true },
  },
  { timestamps: true }
);

// ── Submission ────────────────────────────────────────────────────────────────
const submissionSchema = new mongoose.Schema(
  {
    assignment:  { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', required: true },
    student:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    fileUrl:     { type: String, required: true },
    publicId:    { type: String },
    fileName:    { type: String },
    submittedAt: { type: Date, default: Date.now },
    isLate:      { type: Boolean, default: false },
    score:       { type: Number, min: 0 },
    feedback:    { type: String },
    gradedAt:    { type: Date },
    gradedBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// One submission per student per assignment
submissionSchema.index({ assignment: 1, student: 1 }, { unique: true });

const Assignment = mongoose.model('Assignment', assignmentSchema);
const Submission  = mongoose.model('Submission', submissionSchema);

module.exports = { Assignment, Submission };
