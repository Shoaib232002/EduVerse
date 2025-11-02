exports.deleteNote = async (req, res) => {
  try {
    const { classId, noteId } = req.params;
    const note = await Notes.findById(noteId);
    if (!note) return res.status(404).json({ message: 'Note not found' });
    // Only uploader or teacher can delete
    if (String(note.uploader) !== String(req.user._id) && req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Not authorized to delete this note' });
    }
    await Notes.findByIdAndDelete(noteId);
    // Return updated notes list for the class
    const notes = await Notes.find({ class: classId }).populate('uploader', 'name role');
    res.json({ success: true, notes });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete note', error: err.message });
  }
};
const Notes = require('../models/Notes');
const cloudinary = require('../config/cloudinary');
const Class = require('../models/Class');

exports.uploadNote = async (req, res) => {
  try {
    // Accept classId from params, title/description from body
    const { title, description } = req.body;
    const { classId } = req.params;
    let fileUrl = '';
    let fileType = '';
    let fileExt = '';
    if (req.file) {
      fileType = req.file.mimetype;
      fileExt = req.file.originalname ? req.file.originalname.substring(req.file.originalname.lastIndexOf('.')) : '';
      const isPDF = fileType === 'application/pdf' || (fileExt && fileExt.toLowerCase() === '.pdf');
      await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream({ resource_type: isPDF ? 'raw' : 'auto' }, (error, result) => {
          if (error) reject(error);
          else {
            fileUrl = result.secure_url;
            resolve();
          }
        });
        stream.end(req.file.buffer);
      });
    }
    if (!title || !fileUrl || !classId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    const note = await Notes.create({
      class: classId,
      uploader: req.user._id,
      title,
      description,
      fileUrl,
      fileType,
      fileExt,
    });

    // Find the class to get all students
    const classObj = await Class.findById(classId).populate('students', '_id name');
    
    // Send notification to all students in the class
    if (classObj) {
      const io = req.app.get('io'); // Get io instance correctly
      if (io) {
        const notificationData = {
          type: 'note',
          message: `New note uploaded: ${title}`,
          data: {
            noteId: note._id,
            title,
            class: classId,
            teacher: req.user.name
          }
        };
        
        // Emit to all students in the class
        classObj.students.forEach(student => {
          io.to(student._id.toString()).emit('notification', notificationData);
        });
      }
    }

    res.status(201).json({ success: true, note });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to upload note', error: err.message });
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
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }
    const fileUrl = note.fileUrl;
    if (!fileUrl || typeof fileUrl !== 'string' || !/^https?:\/\//.test(fileUrl)) {
      return res.status(400).json({ message: 'Invalid or missing file URL for this note.' });
    }
    const fileExt = note.fileExt || (note.fileUrl ? note.fileUrl.substring(note.fileUrl.lastIndexOf('.')) : '');
    const fileType = note.fileType || (fileExt.toLowerCase() === '.pdf' ? 'application/pdf' : 'application/octet-stream');
    const fileName = note.title + fileExt;
    const http = require('http');
    const https = require('https');
    const client = fileUrl.startsWith('https') ? https : http;
    client.get(fileUrl, (fileRes) => {
      if (fileRes.statusCode !== 200) {
        return res.status(500).json({ message: 'Failed to fetch file from remote server.' });
      }
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.setHeader('Content-Type', fileType);
      res.setHeader('Content-Length', fileRes.headers['content-length'] || undefined);
      fileRes.on('data', (chunk) => {
        res.write(chunk);
      });
      fileRes.on('end', () => {
        res.end();
      });
    }).on('error', (err) => {
      console.error('Download error:', err);
      res.status(500).json({ message: 'Failed to download note', error: err.message });
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to download note', error: err.message });
  }
}; 