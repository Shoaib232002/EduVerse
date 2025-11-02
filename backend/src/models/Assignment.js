const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  text: String,
  createdAt: { type: Date, default: Date.now }
});

const submissionSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  files: [String], // Multiple file URLs
  textEntry: String,
  submittedAt: Date,
  grade: Number,
  feedback: String,
  comments: [commentSchema],
  status: { type: String, enum: ['submitted', 'graded', 'returned', 'missing', 'late'], default: 'submitted' }
});

const assignmentSchema = new mongoose.Schema({
  class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  title: { type: String, required: true },
  description: { type: String },
  attachments: [{ type: String }], // Multiple attachments
  topic: { type: String },
  dueDate: { type: Date },
  scheduledAt: { type: Date }, // For scheduled posting
  isDraft: { type: Boolean, default: false },

  submissions: [submissionSchema]
}, { timestamps: true });

module.exports = mongoose.model('Assignment', assignmentSchema);