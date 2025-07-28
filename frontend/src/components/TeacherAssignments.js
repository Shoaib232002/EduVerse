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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!classId) return;
    const data = { ...form, classId };
    dispatch(createAssignment(data)).then(() => {
      setForm({
        title: '', description: '', dueDate: '', topic: '', scheduledAt: '', isDraft: false, files: [], rubric: emptyRubric
      });
      dispatch(fetchAssignments(classId));
    });
  };

  // Add delete assignment functionality
  const handleDeleteAssignment = async (assignmentId) => {
    if (window.confirm('Are you sure you want to delete this assignment?')) {
      try {
        await api.delete(`/api/assignments/${assignmentId}`);
        dispatch(fetchAssignments(classId));
      } catch (err) {
        alert('Failed to delete assignment');
      }
    }
  };

  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold mb-2">Create Assignment</h2>
      <form className="space-y-2 mb-4" onSubmit={handleSubmit}>
        <input name="title" value={form.title} onChange={handleChange} placeholder="Title" className="w-full px-2 py-1 border rounded" required />
        <textarea name="description" value={form.description} onChange={handleChange} placeholder="Description" className="w-full px-2 py-1 border rounded" />
        <input name="topic" value={form.topic} onChange={handleChange} placeholder="Topic/Category" className="w-full px-2 py-1 border rounded" />
        <input name="dueDate" type="date" value={form.dueDate} onChange={handleChange} className="w-full px-2 py-1 border rounded" required />
        <input name="scheduledAt" type="datetime-local" value={form.scheduledAt} onChange={handleChange} className="w-full px-2 py-1 border rounded" />
        <label className="flex items-center space-x-2">
          <input name="isDraft" type="checkbox" checked={form.isDraft} onChange={handleChange} />
          <span>Save as Draft</span>
        </label>
        <input name="files" type="file" multiple accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.ppt,.pptx" onChange={handleChange} className="w-full" />
        <div>
          <div className="font-semibold mb-1">Rubric (optional)</div>
          {form.rubric.map((r, idx) => (
            <div key={idx} className="flex space-x-2 mb-1">
              <input
                type="text"
                placeholder="Criterion"
                value={r.criterion}
                onChange={e => handleRubricChange(idx, 'criterion', e.target.value)}
                className="px-2 py-1 border rounded w-1/2"
              />
              <input
                type="number"
                placeholder="Max Points"
                value={r.maxPoints}
                onChange={e => handleRubricChange(idx, 'maxPoints', e.target.value)}
                className="px-2 py-1 border rounded w-1/4"
                min="0"
              />
              <button type="button" className="text-red-600" onClick={() => removeRubricRow(idx)} disabled={form.rubric.length === 1}>Remove</button>
            </div>
          ))}
          <button type="button" className="text-blue-600" onClick={addRubricRow}>Add Criterion</button>
        </div>
        <button type="submit" className="bg-blue-600 text-white px-4 py-1 rounded" disabled={loading}>{loading ? 'Creating...' : 'Create Assignment'}</button>
      </form>
      {error && <div className="text-red-500 mb-2">{error}</div>}
      <h2 className="text-xl font-semibold mb-2">Assignments</h2>
      {loading ? <div>Loading...</div> : (
        <ul className="space-y-2">
          {assignments.map(a => (
            <li key={a._id} className="border p-2 rounded">
              <div className="font-bold">{a.title}</div>
              <div className="text-sm text-gray-600">Due: {a.dueDate ? new Date(a.dueDate).toLocaleDateString() : 'N/A'}</div>
              {a.topic && <div className="text-sm text-gray-500">Topic: {a.topic}</div>}
              {a.scheduledAt && <div className="text-sm text-yellow-600">Scheduled: {new Date(a.scheduledAt).toLocaleString()}</div>}
              {a.isDraft && <div className="text-sm text-blue-600">Draft</div>}
              {a.attachments && a.attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-1">
                  {a.attachments.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Attachment {i + 1}</a>
                  ))}
                </div>
              )}
              <div className="text-gray-700 mt-1">{a.description}</div>
              {a.rubric && a.rubric.length > 0 && (
                <div className="mt-1">
                  <div className="font-semibold">Rubric:</div>
                  <ul className="list-disc ml-6">
                    {a.rubric.map((r, i) => (
                      <li key={i}>{r.criterion} ({r.maxPoints} pts)</li>
                    ))}
                  </ul>
                </div>
              )}
              {/* Delete assignment button for teachers */}
              <button
                className="text-xs bg-red-600 text-white px-2 py-1 rounded mt-2 hover:bg-red-700"
                onClick={() => handleDeleteAssignment(a._id)}
              >Delete Assignment</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default TeacherAssignments;