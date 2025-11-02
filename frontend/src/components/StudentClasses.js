import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { joinClassByCode, fetchClasses, setCurrentClass } from '../store/classSlice';
import { FaGraduationCap, FaPlus } from 'react-icons/fa';

const StudentClasses = ({ onSelect }) => {
  const dispatch = useDispatch();
  const { classes, loading: classesLoading, error, current } = useSelector((state) => state.classes);
  const [joinCode, setJoinCode] = useState('');
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [joinMsg, setJoinMsg] = useState('');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await dispatch(fetchClasses()).unwrap();
        if (Array.isArray(result) && result.length > 0 && !current) {
          const studentClasses = result.filter(cls => !cls.isTeacher);
          if (studentClasses.length > 0) {
            dispatch(setCurrentClass(studentClasses[0]));
          }
        }
      } catch (error) {
        console.error('Error fetching classes:', error);
        // Show error in UI instead of console
        setJoinMsg(error.message || 'Failed to fetch classes. Please try again.');
      }
    };
    fetchData();
  }, [dispatch, current]);

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!joinCode) {
      setJoinMsg('Please enter a join code');
      return;
    }
    try {
      setLoading(true);
      const result = await dispatch(joinClassByCode(joinCode.trim())).unwrap();
      
      // Show success message
      setJoinMsg('Joined class successfully!');
      setJoinCode('');
      setShowJoinForm(false);
      
      // Refresh classes list
      await dispatch(fetchClasses());
      
      // Set the newly joined class as current
      if (result) {
        dispatch(setCurrentClass(result));
      }
    } catch (error) {
      console.error('Join class error:', error);
      setJoinMsg(typeof error === 'string' ? error : 'Failed to join class. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (cls) => {
    dispatch(setCurrentClass(cls));
    // Don't navigate away, just set the current class
    // if (onSelect) onSelect(cls);
  };

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <FaGraduationCap className="text-green-600" /> Your Classes
        </h2>
        <button
          onClick={() => setShowJoinForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
        >
          <FaPlus /> Join Class
        </button>
      </div>

      {showJoinForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md m-4">
            <h3 className="text-xl font-semibold mb-4">Join a Class</h3>
            <form onSubmit={handleJoin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Class Code
                </label>
                <input
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  placeholder="Enter the class code provided by your teacher"
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  required
                />
              </div>
              {joinMsg && (
                <div className={`text-sm ${
                  typeof joinMsg === 'string' && joinMsg.toLowerCase().includes('success') 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  {joinMsg}
                </div>
              )}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowJoinForm(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || classesLoading}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? 'Joining...' : 'Join Class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {error && <div className="text-red-500 mb-4">{error}</div>}
      
      {classesLoading ? (
        <div className="text-center py-8 text-gray-500">Loading your classes...</div>
      ) : classes.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>You haven't joined any classes yet.</p>
          <button
            onClick={() => setShowJoinForm(true)}
            className="text-green-600 hover:text-green-700 mt-2"
          >
            Join your first class
          </button>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
          {classes.map(cls => (
            <div
              key={cls._id}
              onClick={() => handleSelect(cls)}
              className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md 
                ${current && current._id === cls._id 
                  ? 'bg-green-50 border-green-500' 
                  : 'hover:border-green-500'
                }`}
            >
              <h3 className="font-bold text-lg mb-2">{cls.name}</h3>
              <p className="text-gray-600 text-sm mb-2">{cls.description}</p>
              <div className="text-xs text-gray-500">Teacher: {cls.teacher.name}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentClasses;