import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchClasses, createClass, joinClassByCode } from '../store/classSlice';
import { FaPlus, FaChalkboardTeacher, FaUserGraduate, FaEllipsisV, FaFolder } from 'react-icons/fa';
import ClassDetails from '../components/ClassDetails';

const TeacherDashboard = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { classes, loading, error } = useSelector((state) => state.classes);
  const [selectedClass, setSelectedClass] = useState(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [classData, setClassData] = useState({
    name: '',
    subject: '',
    room: ''
  });
  const [joinCode, setJoinCode] = useState('');

  useEffect(() => {
    dispatch(fetchClasses());
  }, [dispatch]);

  const handleCreateClass = async (e) => {
    e.preventDefault();
    const result = await dispatch(createClass(classData));
    if (!result.error) {
      setShowCreateModal(false);
      setClassData({ name: '', subject: '', room: '' });
    }
  };

  const handleJoinClass = async (e) => {
    e.preventDefault();
    const result = await dispatch(joinClassByCode(joinCode));
    if (!result.error) {
      setShowJoinModal(false);
      setJoinCode('');
    }
  };

  const getRandomHeaderColor = () => {
    const colors = [
      'bg-blue-600', 'bg-green-600', 'bg-purple-600',
      'bg-pink-600', 'bg-indigo-600', 'bg-teal-600'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  // Function to split classes into teaching and enrolled
  const getClassesByRole = () => {
    if (!Array.isArray(classes)) {
      console.error('Classes is not an array:', classes);
      return { teaching: [], enrolled: [] };
    }
    const teaching = classes.filter(c => c.teacher?._id === user?._id);
    const enrolled = classes.filter(c => c.teacher?._id !== user?._id);
    return { teaching, enrolled };
  };

  const { teaching, enrolled } = getClassesByRole();

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Classes</h1>
        <div className="space-x-4">
          <button
            onClick={() => setShowJoinModal(true)}
            className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors mt-10"
          >
            Join Class
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <FaPlus /> Create Class
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-md mb-6">
          {error}
        </div>
      )}

      {/* Teaching Classes Section */}
      {teaching.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-gray-700">
            <FaChalkboardTeacher /> Teaching
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {teaching.map((classItem) => (
              <div
                key={classItem._id}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden cursor-pointer"
                onClick={() => setSelectedClass({ ...classItem, headerColor: getRandomHeaderColor() })}
              >
                <div className={`${getRandomHeaderColor()} h-24 p-4 text-white relative`}>
                  <h3 className="text-xl font-medium">{classItem.name}</h3>
                  <div className="text-sm opacity-90 flex items-center gap-2">
                    <span>{classItem.subject}</span>
                    {user?.name && (
                      <>
                        <span className="text-white/50">•</span>
                        <span>By {user.name}</span>
                      </>
                    )}
                  </div>
                  <button className="absolute top-2 right-2 p-1 hover:bg-white/20 rounded-full">
                    <FaEllipsisV />
                  </button>
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-gray-600">Room {classItem.room}</p>
                    <p className="text-xs text-gray-500">Code: {classItem.joinCode}</p>
                  </div>
                  <div className="flex items-center gap-2 text-gray-500">
                    <FaFolder />
                    <span className="text-sm">Class Materials</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Enrolled Classes Section */}
      {enrolled.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-gray-700">
            <FaUserGraduate /> Enrolled
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {enrolled.map((classItem) => (
              <div
                key={classItem._id}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden cursor-pointer"
                onClick={() => setSelectedClass({ ...classItem, headerColor: getRandomHeaderColor() })}
              >
                <div className={`${getRandomHeaderColor()} h-24 p-4 text-white relative`}>
                  <h3 className="text-xl font-medium">{classItem.name}</h3>
                  <div className="text-sm opacity-90 flex items-center gap-2">
                    <span>{classItem.subject}</span>
                    {classItem.teacher?.name && (
                      <>
                        <span className="text-white/50">•</span>
                        <span>By {classItem.teacher.name}</span>
                      </>
                    )}
                  </div>
                  <button className="absolute top-2 right-2 p-1 hover:bg-white/20 rounded-full">
                    <FaEllipsisV />
                  </button>
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-gray-600">Room {classItem.room}</p>
                    <p className="text-xs text-gray-500">Code: {classItem.joinCode}</p>
                  </div>
                  <div className="flex items-center gap-2 text-gray-500">
                    <FaFolder />
                    <span className="text-sm">Class Materials</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Class Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-semibold mb-4">Create Class</h2>
            <form onSubmit={handleCreateClass}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Class Name
                  </label>
                  <input
                    type="text"
                    value={classData.name}
                    onChange={(e) => setClassData({ ...classData, name: e.target.value })}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={classData.subject}
                    onChange={(e) => setClassData({ ...classData, subject: e.target.value })}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Room
                  </label>
                  <input
                    type="text"
                    value={classData.room}
                    onChange={(e) => setClassData({ ...classData, room: e.target.value })}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Join Class Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-semibold mb-4">Join Class</h2>
            <form onSubmit={handleJoinClass}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Class Code
                </label>
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                  required
                  placeholder="Enter class code"
                />
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowJoinModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Join
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && classes.length === 0 && (
        <div className="text-center py-12">
          <div className="bg-white rounded-lg p-8 max-w-md mx-auto shadow-sm">
            <FaChalkboardTeacher className="text-5xl text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Classes Yet</h3>
            <p className="text-gray-500 mb-6">
              Create a class to get started or join an existing class using a code
            </p>
            <div className="space-x-4">
              <button
                onClick={() => setShowJoinModal(true)}
                className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
              >
                Join Class
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Create Class
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Class Details Modal */}
      {selectedClass && (
        <ClassDetails
          classData={selectedClass}
          onClose={() => setSelectedClass(null)}
        />
      )}
    </div>
  );
};

export default TeacherDashboard;
