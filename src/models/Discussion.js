const mongoose = require('mongoose');

// ── Discussion Thread ─────────────────────────────────────────────────────────
const discussionSchema = new mongoose.Schema(
  {
    course:    { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    author:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title:     { type: String, required: true, trim: true },
    body:      { type: String, required: true },
    isPinned:  { type: Boolean, default: false },
    isClosed:  { type: Boolean, default: false },
    views:     { type: Number, default: 0 },
  },
  { timestamps: true, toJSON: { virtuals: true } }
);

discussionSchema.virtual('replyCount', {
  ref:          'DiscussionPost',
  localField:   '_id',
  foreignField: 'thread',
  count:        true,
});

// ── Discussion Post (reply) ───────────────────────────────────────────────────
const discussionPostSchema = new mongoose.Schema(
  {
    thread:   { type: mongoose.Schema.Types.ObjectId, ref: 'Discussion', required: true },
    author:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    body:     { type: String, required: true },
    isAnswer: { type: Boolean, default: false }, // lecturer marked as correct
  },
  { timestamps: true }
);

const Discussion     = mongoose.model('Discussion', discussionSchema);
const DiscussionPost = mongoose.model('DiscussionPost', discussionPostSchema);

module.exports = { Discussion, DiscussionPost };
