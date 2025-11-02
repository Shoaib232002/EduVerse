import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FaDownload, FaBook, FaTrash } from 'react-icons/fa';
import { fetchNotes, deleteNotes } from '../store/notesSlice';

const StudentNotes = ({ classId }) => {
  const dispatch = useDispatch();
  const { notes, loading, error } = useSelector((state) => state.notes);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (classId) {
      dispatch(fetchNotes(classId));
    }
  }, [dispatch, classId]);

  // Filter notes for the current class only
  const classNotes = Array.isArray(notes)
    ? notes.filter(note => note.class === classId || note.class?._id === classId)
    : [];

  const handleDownload = async (note) => {
    try {
      // Fetch the file from backend
  const response = await fetch(`http://localhost:5000/api/notes/download/${note._id}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to download file');
      // Get the file blob
      const blob = await response.blob();
      // Create a link and trigger download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = note.title + (note.fileUrl ? note.fileUrl.substring(note.fileUrl.lastIndexOf('.')) : '');
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert('Download failed: ' + (error?.message || error));
    }
  };

  const handleDelete = async (noteId) => {
    if (!window.confirm('Are you sure you want to delete this note?')) return;
    try {
      await dispatch(deleteNotes({ classId, noteId })).unwrap();
    } catch (error) {
      alert('Failed to delete note: ' + error.message);
    }
  };

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
      {classNotes.length > 0 ? (
        <div className="space-y-3">
          {classNotes.map((note) => (
            <div
              key={note._id}
              className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex-1">
                <h4 className="font-medium">{note.title}</h4>
                <p className="text-sm text-gray-500">
                  {note.createdAt ? new Date(note.createdAt).toLocaleDateString() : 'Unknown date'}
                </p>
                {note.description && (
                  <p className="text-xs text-gray-400">{note.description}</p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleDownload(note)}
                  className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors"
                  title="Download"
                >
                  <FaDownload /> Download
                </button>
                {user?.role === 'teacher' && (note.uploader?._id === user._id) && (
                  <button
                    onClick={() => handleDelete(note._id)}
                    className="flex items-center gap-2 px-3 py-2 text-sm bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors"
                    title="Delete"
                  >
                    <FaTrash /> Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
          ) : (
            <div className="text-gray-500 text-center py-4">No notes available for this class.</div>
          )}
    </div>
  );
};

export default StudentNotes;