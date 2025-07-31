import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FaBullhorn, FaClock, FaUser } from 'react-icons/fa';
import { fetchAnnouncements } from '../store/classSlice';

const StudentAnnouncements = ({ classId }) => {
  const dispatch = useDispatch();
  const { announcements, loading, error } = useSelector((state) => ({
    announcements: state.classes.announcements,
    loading: state.classes.loading,
    error: state.classes.error
  }));

  useEffect(() => {
    if (classId) {
      dispatch(fetchAnnouncements(classId));
    }
  }, [dispatch, classId]);

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
                        download
                        className="flex items-center gap-2 px-3 py-2 bg-gray-50 text-gray-700 rounded-md hover:bg-gray-100 transition-colors text-sm"
                      >
                        {attachment.name}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
          <FaBullhorn className="mx-auto text-4xl mb-2 text-gray-400" />
          <p>No announcements posted yet.</p>
        </div>
      )}
    </div>
  );
};

export default StudentAnnouncements;
