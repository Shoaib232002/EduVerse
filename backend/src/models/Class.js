const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  joinCode: { type: String, unique: true },
  scheduled: Boolean,
  startTime: Date,
  endTime: Date,
  recurring: Boolean,
  recurrencePattern: String,
  password: String,
  waitingRoom: Boolean,
  videoOn: Boolean,
  audioOn: Boolean,
  meeting: { type: mongoose.Schema.Types.ObjectId, ref: 'Meeting' },
  section: { type: String },
  subject: { type: String },
  room: { type: String },
  assignments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Assignment' }],
  announcements: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Announcement' }]
}, { timestamps: true });

module.exports = mongoose.model('Class', classSchema);