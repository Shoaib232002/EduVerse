const mongoose = require('mongoose');

const notesSchema = new mongoose.Schema({
  class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  uploader: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  fileUrl: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Notes', notesSchema); 