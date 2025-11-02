import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createAssignment, fetchAssignments } from '../store/assignmentSlice';
import api from '../services/api';

const emptyRubric = [{ criterion: '', maxPoints: '' }];

const TeacherAssignments = ({ classId }) => {
  const dispatch = useDispatch();
  const { assignments, loading, error } = useSelector((state) => state.assignments);
  const [form, setForm] = useState({
    title: '',
    description: '',
    dueDate: '',
    topic: '',
    scheduledAt: '',
    isDraft: false,
    files: [],
    rubric: emptyRubric,
  });

  React.useEffect(() => {
    if (classId) dispatch(fetchAssignments(classId));
  }, [classId, dispatch]);

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === 'file') {
      setForm((prev) => ({ ...prev, files: files }));
    } else if (type === 'checkbox') {
      setForm((prev) => ({ ...prev, [name]: checked }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleRubricChange = (idx, field, value) => {
    setForm((prev) => ({
      ...prev,
      rubric: prev.rubric.map((r, i) => i === idx ? { ...r, [field]: value } : r)
    }));
  };

  const addRubricRow = () => {
    setForm((prev) => ({ ...prev, rubric: [...prev.rubric, { criterion: '', maxPoints: '' }] }));
  };

  const removeRubricRow = (idx) => {
    setForm((prev) => ({ ...prev, rubric: prev.rubric.filter((_, i) => i !== idx) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!classId) {
      alert('Class ID is required');
      return;
    }
    
    const data = { ...form, classId };
    try {
      await dispatch(createAssignment(data)).unwrap();
      setForm({
        title: '', description: '', dueDate: '', topic: '', scheduledAt: '', isDraft: false, files: [], rubric: emptyRubric
      });
      dispatch(fetchAssignments(classId));
    } catch (error) {
      console.error('Error creating assignment:', error);
      alert('Failed to create assignment. Please try again.');
    }
  };

  // Add delete assignment functionality
  const handleDeleteAssignment = async (assignmentId) => {
    if (window.confirm('Are you sure you want to delete this assignment?')) {
      try {
        // Use correct API path (no duplicate /api)
        await api.delete(`/assignments/${assignmentId}`);
        // Optionally, filter out deleted assignment locally for instant UI update
        dispatch(fetchAssignments(classId));
      } catch (err) {
        let msg = 'Failed to delete assignment';
        if (err.response && err.response.data && err.response.data.message) {
          msg += `: ${err.response.data.message}`;
        }
        alert(msg);
      }
    }
  };

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-semibold mb-4 text-gray-800">Create Assignment</h2>
      <form className="space-y-4 mb-6 p-4 bg-gray-50 rounded-lg" onSubmit={handleSubmit}>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Assignment Title *</label>
          <input 
            name="title" 
            value={form.title} 
            onChange={handleChange} 
            placeholder="Enter assignment title" 
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
            required 
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea 
            name="description" 
            value={form.description} 
            onChange={handleChange} 
            placeholder="Enter assignment description" 
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows="3"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Topic/Category</label>
            <input 
              name="topic" 
              value={form.topic} 
              onChange={handleChange} 
              placeholder="e.g., Mathematics, Science" 
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Due Date *</label>
            <input 
              name="dueDate" 
              type="date" 
              value={form.dueDate} 
              onChange={handleChange} 
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
              required 
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Schedule Assignment (Optional)</label>
          <input 
            name="scheduledAt" 
            type="datetime-local" 
            value={form.scheduledAt} 
            onChange={handleChange} 
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
          />
          <p className="text-xs text-gray-500 mt-1">Leave empty to publish immediately</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <input 
            name="isDraft" 
            type="checkbox" 
            checked={form.isDraft} 
            onChange={handleChange}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label className="text-sm font-medium text-gray-700">Save as Draft</label>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Attachments</label>
          <input 
            name="files" 
            type="file" 
            multiple 
            accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.ppt,.pptx" 
            onChange={handleChange} 
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
          />
          <p className="text-xs text-gray-500 mt-1">Supported formats: PDF, DOC, DOCX, PNG, JPG, JPEG, PPT, PPTX</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Rubric (Optional)</label>
          <div className="space-y-2">
            {form.rubric.map((r, idx) => (
              <div key={idx} className="flex space-x-2 items-center">
                <input
                  type="text"
                  placeholder="Criterion (e.g., Content Quality)"
                  value={r.criterion}
                  onChange={e => handleRubricChange(idx, 'criterion', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <input
                  type="number"
                  placeholder="Points"
                  value={r.maxPoints}
                  onChange={e => handleRubricChange(idx, 'maxPoints', e.target.value)}
                  className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="0"
                />
                <button 
                  type="button" 
                  className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-md transition-colors" 
                  onClick={() => removeRubricRow(idx)} 
                  disabled={form.rubric.length === 1}
                >
                  Remove
                </button>
              </div>
            ))}
            <button 
              type="button" 
              className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors border border-blue-200" 
              onClick={addRubricRow}
            >
              + Add Criterion
            </button>
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 pt-4">
          <button 
            type="button" 
            onClick={() => setForm({
              title: '', description: '', dueDate: '', topic: '', scheduledAt: '', isDraft: false, files: [], rubric: emptyRubric
            })}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
          >
            Clear Form
          </button>
          <button 
            type="submit" 
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
            disabled={loading}
          >
            {loading ? 'Creating Assignment...' : 'Create Assignment'}
          </button>
        </div>
      </form>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      <div className="border-t pt-6">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">Current Assignments</h2>
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading assignments...</p>
          </div>
        ) : assignments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-lg">No assignments created yet.</p>
            <p className="text-sm">Create your first assignment using the form above.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {assignments.map(a => (
              <div key={a._id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-800">{a.title}</h3>
                    <div className="flex flex-wrap gap-4 mt-1 text-sm text-gray-600">
                      <span>Due: {a.dueDate ? new Date(a.dueDate).toLocaleDateString() : 'No due date'}</span>
                      {a.topic && <span>Topic: {a.topic}</span>}
                      {a.scheduledAt && (
                        <span className="text-yellow-600">Scheduled: {new Date(a.scheduledAt).toLocaleString()}</span>
                      )}
                      {a.isDraft && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">Draft</span>
                      )}
                    </div>
                  </div>
                  <button
                    className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
                    onClick={() => handleDeleteAssignment(a._id)}
                  >
                    Delete
                  </button>
                </div>
                
                {a.description && (
                  <p className="text-gray-700 mb-3">{a.description}</p>
                )}
                
                {a.attachments && a.attachments.length > 0 && (
                  <div className="mb-3">
                    <p className="text-sm font-medium text-gray-700 mb-1">Attachments:</p>
                    <div className="flex flex-wrap gap-2">
                      {a.attachments.map((url, i) => (
                        <a 
                          key={i} 
                          href={url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-blue-600 hover:text-blue-800 underline text-sm"
                        >
                          Attachment {i + 1}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                
                {a.rubric && a.rubric.length > 0 && (
                  <div className="mb-3">
                    <p className="text-sm font-medium text-gray-700 mb-1">Rubric:</p>
                    <ul className="list-disc list-inside text-sm text-gray-600">
                      {a.rubric.map((r, i) => (
                        <li key={i}>{r.criterion} ({r.maxPoints} points)</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <div className="text-xs text-gray-500">
                  Created: {new Date(a.createdAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherAssignments;