import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FaBullhorn, FaClock, FaUser } from 'react-icons/fa';
import { fetchAnnouncements } from '../store/classSlice';
import { io } from 'socket.io-client';

const StudentAnnouncements = ({ classId }) => {
  const dispatch = useDispatch();
  const { announcements, loading, error } = useSelector((state) => ({
    announcements: state.classes.announcements,
    loading: state.classes.loading,
    error: state.classes.error
  }));

  useEffect(() => {
    if (!classId) return;
    dispatch(fetchAnnouncements(classId));
    // Connect to socket for real-time announcements
    const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';
    const socket = io(SOCKET_URL);
    // Join the class room to receive class-specific notifications
    socket.emit('joinClass', { classId });
    // Listen for new announcements
    socket.on('newAnnouncement', (announcement) => {
      if (announcement.class === classId) {
        // Refresh announcements when a new one is created
        dispatch(fetchAnnouncements(classId));
      }
    });
    return () => {
      socket.disconnect();
    };
  }, [dispatch, classId]);

  if (!classId) {
    return (
      <div className="p-4 text-yellow-600 bg-yellow-50 rounded">
        No class selected. Please select or join a class to view announcements.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-500 bg-red-50 rounded">
        Error loading announcements: {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <FaBullhorn className="text-blue-500" />
        <h2 className="text-xl font-semibold">Class Announcements</h2>
      </div>
      {announcements && announcements.length > 0 ? (
        <div className="space-y-4">
          {announcements.map((announcement) => (
            <div
              key={announcement._id}
              className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-medium text-lg">{announcement.title}</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                    <div className="flex items-center gap-1">
                      <FaUser className="text-gray-400" />
                      <span>{announcement.author.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FaClock className="text-gray-400" />
                      <span>{new Date(announcement.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-gray-700 whitespace-pre-wrap">{announcement.content}</p>
              {announcement.attachments && announcement.attachments.length > 0 && (
                <div className="mt-4">
                  <div className="text-sm font-medium text-gray-500 mb-2">Attachments:</div>
                  <div className="flex flex-wrap gap-2">
                    {announcement.attachments.map((attachment, index) => (
                      <a
                        key={index}
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline"
                      >
                        Attachment {index + 1}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          No announcements yet.
        </div>
      )}
    </div>
  );
};

export default StudentAnnouncements;
