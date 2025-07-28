import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createClass, fetchClasses, setCurrentClass } from '../store/classSlice';
import api from '../services/api';

const defaultMeetingOptions = {
  scheduled: false,
  startTime: '',
  endTime: '',
  recurring: false,
  recurrencePattern: 'daily',
  password: '',
  waitingRoom: true,
  videoOn: true,
  audioOn: true,
};

const TeacherClasses = ({ onSelect }) => {
  const dispatch = useDispatch();
  const { classes, loading, error, current } = useSelector((state) => state.classes);
  const [form, setForm] = useState({ name: '', description: '', ...defaultMeetingOptions });
  const [copiedId, setCopiedId] = useState(null);
  const [newClass, setNewClass] = useState(null);

  React.useEffect(() => {
    dispatch(fetchClasses());
  }, [dispatch]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(createClass(form)).then((res) => {
      setForm({ name: '', description: '', ...defaultMeetingOptions });
      dispatch(fetchClasses());
      // Show the new class link if available
      if (res && res.payload && res.payload.joinLink) {
        setNewClass({ name: res.payload.name, joinLink: res.payload.joinLink, _id: res.payload._id });
      }
    });
  };

  const handleSelect = (cls) => {
    dispatch(setCurrentClass(cls));
    if (onSelect) onSelect(cls);
  };

  const handleCopy = (link, id) => {
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  // Add delete class functionality
  const handleDeleteClass = async (classId) => {
    if (window.confirm('Are you sure you want to delete this class?')) {
      try {
        await api.delete(`/api/classes/${classId}`);
        // Optionally show a message or refresh class list
        dispatch(fetchClasses());
      } catch (err) {
        alert('Failed to delete class');
      }
    }
  };

  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold mb-2">Create Class / Meeting</h2>
      {newClass && (
        <div className="mb-4 bg-blue-50 border border-blue-200 rounded p-3 flex items-center space-x-2">
          <span className="font-semibold text-blue-700">New Class:</span>
          <span className="font-semibold">{newClass.name}</span>
          <span className="text-xs text-blue-700 break-all">Invite Link: <a href={newClass.joinLink} target="_blank" rel="noopener noreferrer" className="underline">{newClass.joinLink}</a></span>
          <button
            className="text-xs bg-gray-200 px-2 py-1 rounded hover:bg-gray-300"
            onClick={() => handleCopy(newClass.joinLink, newClass._id)}
          >{copiedId === newClass._id ? 'Copied!' : 'Copy'}</button>
        </div>
      )}
      <form className="space-y-2 mb-4" onSubmit={handleSubmit}>
        <input name="name" value={form.name} onChange={handleChange} placeholder="Class Name (e.g. Physics 101)" className="w-full px-2 py-1 border rounded" required />
        <input name="section" value={form.section || ''} onChange={handleChange} placeholder="Section (e.g. A)" className="w-full px-2 py-1 border rounded" />
        <input name="subject" value={form.subject || ''} onChange={handleChange} placeholder="Subject (e.g. Physics)" className="w-full px-2 py-1 border rounded" />
        <input name="room" value={form.room || ''} onChange={handleChange} placeholder="Room (e.g. 101)" className="w-full px-2 py-1 border rounded" />
        <textarea name="description" value={form.description} onChange={handleChange} placeholder="Description (optional)" className="w-full px-2 py-1 border rounded" />
        <button type="submit" className="bg-blue-600 text-white px-4 py-1 rounded" disabled={loading}>{loading ? 'Creating...' : 'Create Classroom'}</button>
      </form>
      {error && <div className="text-red-500 mb-2">{error}</div>}
      <h2 className="text-xl font-semibold mb-2">Your Classes / Meetings</h2>
      {loading ? <div>Loading...</div> : (
        <ul className="space-y-2">
          {classes.map(cls => (
            <li key={cls._id} className={`border p-2 rounded cursor-pointer ${current && current._id === cls._id ? 'bg-blue-100' : ''}`} onClick={() => handleSelect(cls)}>
              <div className="font-bold">{cls.name}</div>
              {cls.section && <div className="text-sm text-gray-600">Section: {cls.section}</div>}
              {cls.subject && <div className="text-sm text-gray-600">Subject: {cls.subject}</div>}
              {cls.room && <div className="text-sm text-gray-600">Room: {cls.room}</div>}
              <div className="text-gray-700">{cls.description}</div>
              {cls.scheduled && <div className="text-xs text-yellow-700">Scheduled: {cls.startTime ? new Date(cls.startTime).toLocaleString() : ''} - {cls.endTime ? new Date(cls.endTime).toLocaleString() : ''}</div>}
              {cls.recurring && <div className="text-xs text-blue-700">Recurring: {cls.recurrencePattern}</div>}
              {cls.password && <div className="text-xs text-gray-500">Password Protected</div>}
              {cls.joinLink && (
                <div className="mt-2 flex items-center space-x-2">
                  <span className="text-xs text-blue-700 break-all">Shareable Link: <a href={cls.joinLink} target="_blank" rel="noopener noreferrer" className="underline">{cls.joinLink}</a></span>
                  <button
                    className="text-xs bg-gray-200 px-2 py-1 rounded hover:bg-gray-300"
                    onClick={e => { e.stopPropagation(); handleCopy(cls.joinLink, cls._id); }}
                  >{copiedId === cls._id ? 'Copied!' : 'Copy'}</button>
                </div>
              )}
              {/* Delete class button for teachers */}
              <button
                className="text-xs bg-red-600 text-white px-2 py-1 rounded mt-2 hover:bg-red-700"
                onClick={e => { e.stopPropagation(); handleDeleteClass(cls._id); }}
              >Delete Class</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default TeacherClasses;