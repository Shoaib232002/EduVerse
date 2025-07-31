import React, { useState, useEffect } from 'react';
import { FaTrash, FaBullhorn } from 'react-icons/fa';
import ClassComponentWrapper from './ClassComponentWrapper';
import { useSelector } from 'react-redux';
import api from '../services/api';

const TeacherAnnouncements = ({ classId }) => {
  const [announcements, setAnnouncements] = useState([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useSelector(state => state.auth);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      if (!classId) return;
      
      try {
        setError(null);
        const response = await api.get(`/classes/${classId}/announcements`);
        if (response.data.success) {
          setAnnouncements(response.data.data);
        } else {
          setError('Failed to load announcements');
        }
      } catch (err) {
        console.error('Error loading announcements:', err);
        setError('Failed to load announcements');
      }
    };

    fetchAnnouncements();
  }, [classId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !content) {
      alert('Please provide both title and content');
      return;
    }
    setLoading(true);
    try {
      const response = await api.post(`/classes/${classId}/announcements`, {
        title,
        content
      });

      if (response.data.success) {
        const newAnnouncement = response.data.data;
        setAnnouncements([newAnnouncement, ...announcements]);
        setTitle('');
        setContent('');
      } else {
        throw new Error(response.data.message || 'Failed to create announcement');
      }
    } catch (error) {
      console.error('Failed to create announcement:', error);
      alert(error.message || 'Failed to create announcement');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) {
      return;
    }
    try {
      const response = await api.delete(`/classes/${classId}/announcements/${id}`);
      if (response.data.success) {
        setAnnouncements(announcements.filter(announcement => announcement._id !== id));
      } else {
        throw new Error(response.data.message || 'Failed to delete announcement');
      }
    } catch (error) {
      console.error('Failed to delete announcement:', error);
      alert(error.message || 'Failed to delete announcement');
    }
  };

  return (
    <ClassComponentWrapper title="Class Announcements">
      <div className="space-y-6">
        {/* Create Announcement Form */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="font-medium text-lg text-gray-900 mb-4">Create New Announcement</h3>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Announcement Title
              </label>
              <input
                type="text"
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                placeholder="Enter announcement title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Content
              </label>
              <textarea
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                rows="4"
                placeholder="Write your announcement here"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
              />
            </div>
            <div>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Posting...' : 'Post Announcement'}
              </button>
            </div>
          </form>
        </div>

        {/* Announcements List */}
        <div className="mt-8">
          {error && (
            <div className="text-center py-4 text-red-600 bg-red-50 rounded-lg mb-4">
              <p>{error}</p>
            </div>
          )}
          {!error && announcements.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
              <div className="mx-auto w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <FaBullhorn className="text-4xl text-gray-400" />
              </div>
              <h3 className="text-xl font-medium text-gray-700 mb-2">No Announcements Yet</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                This class doesn't have any announcements yet. 
                Create your first announcement above to keep your students informed about important updates.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {announcements.map((announcement) => (
                <div
                  key={announcement.id}
                  className="bg-white p-6 rounded-lg shadow-sm"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-lg text-gray-900 mb-1">
                        {announcement.title}
                      </h3>
                      <p className="text-gray-600 whitespace-pre-wrap">
                        {announcement.content}
                      </p>
                      <div className="mt-2 text-sm text-gray-500">
                        Posted by {announcement.author} on{' '}
                        {new Date(announcement.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(announcement.id)}
                      className="p-2 text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-100 transition-colors"
                      title="Delete announcement"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ClassComponentWrapper>
  );
};

export default TeacherAnnouncements;
