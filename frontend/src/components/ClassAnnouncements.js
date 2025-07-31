import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FaUserCircle, FaPaperPlane, FaTrash, FaEdit } from 'react-icons/fa';

const ClassAnnouncements = ({ classId, isTeacher }) => {
  const dispatch = useDispatch();
  const [newAnnouncement, setNewAnnouncement] = useState('');
  const [announcements, setAnnouncements] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const { user } = useSelector(state => state.auth);

  // Placeholder for actual announcements data
  useEffect(() => {
    // TODO: Fetch announcements from backend
    // dispatch(fetchAnnouncements(classId));
  }, [classId]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newAnnouncement.trim()) return;

    const announcement = {
      id: Date.now(),
      content: newAnnouncement,
      author: user.name,
      timestamp: new Date(),
      authorId: user._id,
    };

    // TODO: Dispatch action to save announcement
    setAnnouncements([announcement, ...announcements]);
    setNewAnnouncement('');
  };

  const handleEdit = (id, content) => {
    setEditingId(id);
    setNewAnnouncement(content);
  };

  const handleDelete = (id) => {
    // TODO: Dispatch action to delete announcement
    setAnnouncements(announcements.filter(a => a.id !== id));
  };

  const handleUpdate = (id) => {
    setAnnouncements(announcements.map(a => 
      a.id === id ? { ...a, content: newAnnouncement } : a
    ));
    setEditingId(null);
    setNewAnnouncement('');
  };

  return (
    <div className="space-y-6">
      {/* Create Announcement Form */}
      {isTeacher && (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-lg">
          <div className="flex gap-3">
            <FaUserCircle className="text-3xl text-gray-400" />
            <div className="flex-1">
              <textarea
                value={newAnnouncement}
                onChange={(e) => setNewAnnouncement(e.target.value)}
                placeholder="Share something with your class..."
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 min-h-[100px]"
              />
              <div className="flex justify-end mt-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  disabled={!newAnnouncement.trim()}
                >
                  <FaPaperPlane /> {editingId ? 'Update' : 'Post'}
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Announcements List */}
      <div className="space-y-4">
        {announcements.map((announcement) => (
          <div key={announcement.id} className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex justify-between items-start">
              <div className="flex gap-3">
                <FaUserCircle className="text-2xl text-gray-400" />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{announcement.author}</h3>
                    <span className="text-sm text-gray-500">
                      {new Date(announcement.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="mt-2 text-gray-700">{announcement.content}</p>
                </div>
              </div>
              {isTeacher && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(announcement.id, announcement.content)}
                    className="text-gray-500 hover:text-blue-600 transition-colors"
                  >
                    <FaEdit />
                  </button>
                  <button
                    onClick={() => handleDelete(announcement.id)}
                    className="text-gray-500 hover:text-red-600 transition-colors"
                  >
                    <FaTrash />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {announcements.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No announcements yet.
            {isTeacher && " Create one to keep your class updated!"}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClassAnnouncements;
