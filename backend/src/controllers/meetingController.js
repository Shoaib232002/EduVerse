// Start meeting (teacher only)
exports.startMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) return res.status(404).json({ success: false, message: 'Meeting not found' });
    if (String(meeting.host) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Only host can start the meeting' });
    }
    meeting.active = true;
    await meeting.save();
    res.json({ success: true, data: meeting });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// End meeting (teacher only)
exports.endMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) return res.status(404).json({ success: false, message: 'Meeting not found' });
    if (String(meeting.host) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Only host can end the meeting' });
    }
    meeting.active = false;
    await meeting.save();
    res.json({ success: true, data: meeting });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
const Meeting = require('../models/Meeting');

exports.createMeeting = async (req, res) => {
  try {
    const newMeeting = await Meeting.create({
      ...req.body,
      host: req.user._id
    });
    res.status(201).json({ success: true, data: newMeeting });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getMeetings = async (req, res) => {
  try {
    const meetings = await Meeting.find({
      $or: [
        { host: req.user._id },
        { participants: req.user._id }
      ]
    });
    res.json({ success: true, data: meetings });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getMeetingById = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) {
      return res.status(404).json({ success: false, message: 'Meeting not found' });
    }
    res.json({ success: true, data: meeting });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.updateMeeting = async (req, res) => {
  try {
    const updatedMeeting = await Meeting.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedMeeting) {
      return res.status(404).json({ success: false, message: 'Meeting not found' });
    }
    res.json({ success: true, data: updatedMeeting });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.deleteMeeting = async (req, res) => {
  try {
    const deletedMeeting = await Meeting.findByIdAndDelete(req.params.id);
    if (!deletedMeeting) {
      return res.status(404).json({ success: false, message: 'Meeting not found' });
    }
    res.json({ success: true, data: {} });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};