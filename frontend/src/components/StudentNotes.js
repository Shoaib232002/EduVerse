import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FaDownload, FaBook } from 'react-icons/fa';
import { fetchNotes } from '../store/notesSlice';

const StudentNotes = ({ classId }) => {
  const dispatch = useDispatch();
  const notesState = useSelector((state) => state.notes);
  const { user } = useSelector((state) => state.auth);
  const [enrolledInClass, setEnrolledInClass] = useState(false);

  const notes = notesState?.notes || [];
  const loading = notesState?.loading || false;
  const error = notesState?.error;

  useEffect(() => {
    // Check if student is enrolled in the class
    if (user?.enrolledClasses?.includes(classId)) {
      setEnrolledInClass(true);
      dispatch(fetchNotes(classId));
    }
  }, [dispatch, classId, user]);

  if (!enrolledInClass) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg">
        <FaBook className="text-4xl text-gray-400 mb-4" />
        <h3 className="text-xl font-semibold text-gray-600 mb-2">No Notes Available</h3>
        <p className="text-gray-500 text-center">
          Join this class to access the notes shared by your teacher.
        </p>
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
        Error loading notes: {error}
      </div>
    );
  }

  return (
    <div className="p-4">
      <h3 className="text-xl font-semibold mb-4">Class Notes</h3>
      {notes && notes.length > 0 ? (
        <div className="space-y-3">
          {notes.map((note) => (
            <div 
              key={note._id}
              className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex-1">
                <h4 className="font-medium">{note.title}</h4>
                <p className="text-sm text-gray-500">
                  {new Date(note.uploadDate).toLocaleDateString()}
                </p>
              </div>
              <a
                href={note.fileUrl}
                download
                className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors"
              >
                <FaDownload /> Download
              </a>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center p-6 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No notes have been shared in this class yet.</p>
        </div>
      )}
    </div>
  );
};

export default StudentNotes;