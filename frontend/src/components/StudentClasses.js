import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { joinClass, fetchClasses, setCurrentClass } from '../store/classSlice';

const StudentClasses = ({ onSelect }) => {
  const dispatch = useDispatch();
  const { classes, loading, error, current } = useSelector((state) => state.classes);
  const [joinId, setJoinId] = useState('');
  const [joinMsg, setJoinMsg] = useState('');

  React.useEffect(() => {
    dispatch(fetchClasses());
  }, [dispatch]);

  const handleJoin = (e) => {
    e.preventDefault();
    if (!joinId) return;
    dispatch(joinClass(joinId)).then((res) => {
      if (res.meta.requestStatus === 'fulfilled') {
        setJoinMsg('Joined successfully!');
        setJoinId('');
        dispatch(fetchClasses());
      } else {
        setJoinMsg('Failed to join class');
      }
    });
  };

  const handleSelect = (cls) => {
    dispatch(setCurrentClass(cls));
    if (onSelect) onSelect(cls);
  };

  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold mb-2">Join a Class</h2>
      <form className="space-y-2 mb-4" onSubmit={handleJoin}>
        <input value={joinId} onChange={e => setJoinId(e.target.value)} placeholder="Class ID" className="w-full px-2 py-1 border rounded" required />
        <button type="submit" className="bg-green-600 text-white px-4 py-1 rounded" disabled={loading}>{loading ? 'Joining...' : 'Join Class'}</button>
      </form>
      {joinMsg && <div className="mb-2 text-blue-600">{joinMsg}</div>}
      {error && <div className="text-red-500 mb-2">{error}</div>}
      <h2 className="text-xl font-semibold mb-2">Your Classes</h2>
      {loading ? <div>Loading...</div> : (
        <ul className="space-y-2">
          {classes.map(cls => (
            <li key={cls._id} className={`border p-2 rounded cursor-pointer ${current && current._id === cls._id ? 'bg-green-100' : ''}`} onClick={() => handleSelect(cls)}>
              <div className="font-bold">{cls.name}</div>
              <div className="text-gray-700">{cls.description}</div>
              <div className="text-xs text-gray-500">ID: {cls._id}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default StudentClasses; 