const mongoose = require('mongoose');

const materialSchema = new mongoose.Schema(
  {
    course:       { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    uploadedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title:        { type: String, required: true, trim: true },
    description:  { type: String },
    category:     {
      type: String,
      enum: [
        'lecture_note', 'syllabus', 'assignment', 'quiz',
        'exam', 'past_question', 'answer_guide', 'supplementary', 'video'
      ],
      required: true,
    },
    fileUrl:      { type: String, required: true },
    publicId:     { type: String }, // Cloudinary public_id for deletion
    fileName:     { type: String },
    fileSize:     { type: Number }, // bytes
    mimeType:     { type: String },
    week:         { type: Number }, // optional: which week this belongs to
    isVisible:    { type: Boolean, default: true },
    downloadCount:{ type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Material', materialSchema);
