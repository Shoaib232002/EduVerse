import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FaUpload, FaTrash, FaDownload, FaFile } from 'react-icons/fa';
import { fetchNotes, uploadNotes, deleteNotes } from '../store/notesSlice';

const TeacherNotes = ({ classId }) => {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [fileName, setFileName] = useState('');
  const dispatch = useDispatch();
  const { notes, loading, error, uploadStatus } = useSelector((state) => state.notes);
  
  useEffect(() => {
    if (classId) {
      dispatch(fetchNotes(classId));
    }
  }, [dispatch, classId]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Accept only PDF or image formats
      const allowedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/bmp',
        'image/webp',
        'image/svg+xml'
      ];
      if (!allowedTypes.includes(selectedFile.type)) {
        alert('Only PDF and image files are allowed.');
        return;
      }
      setFile(selectedFile);
      setFileName(selectedFile.name);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || !title) {
      alert('Please provide a title and select a file');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    formData.append('description', description);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/notes/upload/${classId}`, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData,
      });
      const contentType = response.headers.get('content-type');
      let result;
      if (contentType && contentType.includes('application/json')) {
        result = await response.json();
      } else {
        result = await response.text();
        console.error('Upload error: Non-JSON response', result);
        throw new Error('Server returned non-JSON response: ' + result);
      }
      if (!response.ok) {
        console.error('Upload error:', result);
        throw new Error(result.message || 'Failed to upload notes');
      }
      dispatch(fetchNotes(classId));
      setTitle('');
      setDescription('');
      setFile(null);
      setFileName('');
    } catch (error) {
      alert('Failed to upload note: ' + (error?.message || error));
    }
  };

  const handleDownload = (note) => {
    // Download with Authorization header
    const token = localStorage.getItem('token');
    fetch(`http://localhost:5000/api/notes/download/${note._id}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(response => {
        if (!response.ok) throw new Error('Failed to download file');
        return response.blob();
      })
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = note.title + (note.fileUrl ? note.fileUrl.substring(note.fileUrl.lastIndexOf('.')) : '');
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      })
      .catch(error => {
        alert('Download failed: ' + (error?.message || error));
      });
  };
  
  const handleDelete = async (noteId) => {
    if (!window.confirm('Are you sure you want to delete this note?')) return;
    
    try {
      await dispatch(deleteNotes({ classId, noteId })).unwrap();
    } catch (error) {
      alert('Failed to delete note: ' + error.message);
    }
  };
  
  // Filter notes for the current class only
  const classNotes = Array.isArray(notes)
    ? notes.filter(note => note.class === classId || note.class?._id === classId)
    : [];

  return (
    <div className="bg-white rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-6">Class Notes</h2>
      {error && <div className="text-red-500 mb-4">{error}</div>}
      {loading && <div className="text-blue-500 mb-4">Loading notes...</div>}
      {/* Hidden File Input */}
      <input
        type="file"
        className="hidden"
        id="note-file"
        accept=".pdf,image/*"
        onChange={handleFileChange}
      />

      {/* Upload Form */}
      <form onSubmit={handleUpload} className="space-y-4 mb-8">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Title
          </label>
          <input
            type="text"
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            placeholder="Enter note title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            rows="3"
            placeholder="Add a description for your note"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Upload File
          </label>
          <div className="flex items-center gap-2">
            <label
              htmlFor="note-file"
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded cursor-pointer hover:bg-gray-200 transition-colors flex items-center gap-2"
            >
              <FaUpload /> Choose File
            </label>
            <span className="text-sm text-gray-500">
              {fileName || 'No file chosen'}
            </span>
          </div>
        </div>

        <button
          type="submit"
          disabled={uploadStatus === 'loading'}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {uploadStatus === 'loading' ? 'Uploading...' : 'Upload Note'}
        </button>
      </form>

      {/* Notes List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-700">Uploaded Notes</h3>
          <button
            onClick={() => document.getElementById('note-file').click()}
            className="flex items-center gap-2 px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors text-sm"
          >
            <FaUpload /> Upload New Note
          </button>
        </div>
        
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2 text-gray-500">Loading notes...</p>
          </div>
        ) : classNotes.length > 0 ? (
          <div className="divide-y bg-white rounded-lg shadow">
            {classNotes.map((note) => (
              <div key={note._id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FaFile className="text-gray-400 text-xl" />
                  <div>
                    <h4 className="font-medium">{note.title}</h4>
                    {note.description && (
                      <p className="text-sm text-gray-500">{note.description}</p>
                    )}
                    <span className="text-xs text-gray-400">
                      Uploaded on {new Date(note.uploadDate || note.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDownload(note)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                    title="Download"
                  >
                    <FaDownload />
                  </button>
                  <button
                    onClick={() => handleDelete(note._id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                    title="Delete"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <FaUpload className="mx-auto text-5xl text-gray-400 mb-4" />
            <h4 className="text-lg font-medium text-gray-600 mb-2">No Notes Available</h4>
            <p className="text-gray-500 mb-6">Upload study materials for your students.</p>
            <label
              htmlFor="note-file"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors cursor-pointer"
            >
              <FaUpload /> Upload Your First Note
            </label>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherNotes;