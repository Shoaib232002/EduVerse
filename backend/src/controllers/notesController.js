const Notes = require('../models/Notes');
const cloudinary = require('../config/cloudinary');

exports.uploadNote = async (req, res) => {
  try {
    const { classId, title } = req.body;
    let fileUrl = '';
    if (req.file) {
      await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream({ resource_type: 'auto' }, (error, result) => {
          if (error) reject(error);
          else {
            fileUrl = result.secure_url;
            resolve();
          }
        });
        stream.end(req.file.buffer);
      });
    }
    const note = await Notes.create({
      class: classId,
      uploader: req.user._id,
      title,
      fileUrl,
    });
    res.status(201).json({ note });
  } catch (err) {
    res.status(500).json({ message: 'Failed to upload note', error: err.message });
  }
};

exports.getNotes = async (req, res) => {
  try {
    const { classId } = req.params;
    const notes = await Notes.find({ class: classId }).populate('uploader', 'name role');
    res.json({ notes });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch notes', error: err.message });
  }
};

exports.downloadNote = async (req, res) => {
  try {
    const { id } = req.params;
    const note = await Notes.findById(id);
    if (!note) return res.status(404).json({ message: 'Note not found' });
    return res.redirect(note.fileUrl);
  } catch (err) {
    res.status(500).json({ message: 'Failed to download note', error: err.message });
  }
}; 