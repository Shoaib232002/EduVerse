import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { FaUpload, FaTrash, FaDownload, FaFile } from 'react-icons/fa';
import ClassComponentWrapper from './ClassComponentWrapper';

const TeacherNotes = ({ classId }) => {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState([]);
  const [fileName, setFileName] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
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
    setUploading(true);
    try {
      // TODO: Implement upload logic here
      // const formData = new FormData();
      // formData.append('file', file);
      // formData.append('title', title);
      // formData.append('description', description);
      // await api.post(`/api/classes/${classId}/notes`, formData);
      setTitle('');
      setDescription('');
      setFile(null);
      setFileName('');
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload note');
    } finally {
      setUploading(false);
    }
  };

  return (
    <ClassComponentWrapper title="Class Notes">
      {/* Hidden File Input */}
      <input
        type="file"
        className="hidden"
        id="note-file"
        accept=".pdf,.doc,.docx,.ppt,.pptx"
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
          disabled={uploading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {uploading ? 'Uploading...' : 'Upload Note'}
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
        
        {notes.length === 0 ? (
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
        ) : (
          <div className="divide-y bg-white rounded-lg shadow">
            {notes.map((note) => (
              <div key={note.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FaFile className="text-gray-400 text-xl" />
                  <div>
                    <h4 className="font-medium">{note.title}</h4>
                    {note.description && (
                      <p className="text-sm text-gray-500">{note.description}</p>
                    )}
                    <span className="text-xs text-gray-400">
                      Uploaded on {new Date(note.uploadDate).toLocaleDateString()}
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
                    onClick={() => handleDelete(note.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                    title="Delete"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ClassComponentWrapper>
  );
};

export default TeacherNotes;