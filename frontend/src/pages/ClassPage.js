import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getClass, setCurrentClass } from '../store/classSlice';
import { SiGoogleclassroom } from 'react-icons/si';
import { FaArrowLeft, FaBook, FaClipboardList, FaBullhorn, FaUsers, FaGraduationCap } from 'react-icons/fa';
import ClassComponentWrapper from '../components/ClassComponentWrapper';
import TeacherNotes from '../components/TeacherNotes';
import TeacherAssignments from '../components/TeacherAssignments';
import TeacherGrading from '../components/TeacherGrading';
import TeacherAnnouncements from '../components/TeacherAnnouncements';
import TeacherPeople from '../components/TeacherPeople';
import StudentNotes from '../components/StudentNotes';
import StudentAssignments from '../components/StudentAssignments';
import StudentGrades from '../components/StudentGrades';
import StudentAnnouncements from '../components/StudentAnnouncements';
import StudentPeople from '../components/StudentPeople';
import { Link } from 'react-router-dom';
const TabButton = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`px-4 py-3 font-medium rounded-t-lg transition-all duration-200 flex items-center gap-2 ${
      active
        ? 'bg-white text-blue-600 border-t-2 border-blue-600 shadow-sm'
        : 'text-gray-600 hover:text-blue-600 hover:bg-white/50'
    }`}
  >
    {children}
  </button>
);

const ClassPage = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { current: classData, loading, error } = useSelector((state) => state.classes);
  const [activeTab, setActiveTab] = useState('announcements');

  useEffect(() => {
    if (classId) {
      dispatch(getClass(classId));
    }
    
    // Cleanup function to reset current class when unmounting
    return () => {
      dispatch(setCurrentClass(null));
    };
  }, [dispatch, classId]);

  const isTeacher = classData?.teacher?._id === user?._id;

  const getRandomHeaderColor = () => {
    const colors = [
      'bg-blue-600', 'bg-green-600', 'bg-purple-600',
      'bg-pink-600', 'bg-indigo-600', 'bg-teal-600'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50 mt-10">
        <div className="bg-red-50 text-red-600 p-6 rounded-lg shadow-sm max-w-md">
          <h2 className="text-xl font-semibold mb-2">Error</h2>
          <p>{error}</p>
          <button 
            onClick={handleGoBack}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!classData) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="bg-yellow-50 text-yellow-600 p-6 rounded-lg shadow-sm max-w-md">
          <h2 className="text-xl font-semibold mb-2">Class Not Found</h2>
          <p>The class you're looking for doesn't exist or you don't have access to it.</p>
          <button 
            onClick={handleGoBack}
            className="mt-4 px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const headerColor = classData.headerColor || getRandomHeaderColor();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className={`${headerColor} p-6 text-white mt-20 relative`}>
        <button
          onClick={handleGoBack}
          className="absolute top-6 left-6 text-white hover:bg-white/20 p-2 rounded-full transition-colors"
          aria-label="Go back"
        >
          <FaArrowLeft />
        </button>
        <div className="max-w-7xl mx-auto pl-12">
          <h1 className="text-3xl font-bold">{classData.name}</h1>
          <div className="mt-2 opacity-90 flex flex-wrap items-center gap-x-4 gap-y-2">
            <span className="text-lg">{classData.subject}</span>
            {classData.section && (
              <span className="text-lg">Section: {classData.section}</span>
            )}
            {classData.room && (
              <span className="text-lg">Room: {classData.room}</span>
            )}
            {classData.teacher?.name && (
              <span className="text-lg">Teacher: {classData.teacher.name}</span>
            )}
          </div>
          <div className="mt-4 flex items-center gap-4">
            <div className="px-3 py-1.5 bg-white/20 rounded-md flex items-center gap-2">
              <span>Class Code: {classData.joinCode}</span>
              {navigator.clipboard && (
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(classData.joinCode);
                    // You could add a toast notification here
                  }}
                  className="p-1 hover:bg-white/20 rounded transition-colors"
                  title="Copy class code"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-gray-200 px-6 flex gap-4 overflow-x-auto sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto w-full flex gap-4">
          <TabButton
            active={activeTab === 'announcements'}
            onClick={() => setActiveTab('announcements')}
          >
            <FaBullhorn /> Announcements
          </TabButton>
          <TabButton
            active={activeTab === 'notes'}
            onClick={() => setActiveTab('notes')}
          >
            <FaBook /> Notes
          </TabButton>
          <TabButton
            active={activeTab === 'assignments'}
            onClick={() => setActiveTab('assignments')}
          >
            <FaClipboardList /> Assignments
          </TabButton>
          <TabButton
            active={activeTab === 'grading'}
            onClick={() => setActiveTab('grading')}
          >
            <FaGraduationCap /> Grading
          </TabButton>
          <TabButton
            active={activeTab === 'people'}
            onClick={() => setActiveTab('people')}
          >
            <FaUsers /> People
          </TabButton>
          <Link to="/classes"><TabButton
            active={activeTab === 'myclasses'}
            onClick={() => setActiveTab('myclasses')}
          >
            <SiGoogleclassroom /> My Classes
          </TabButton></Link>
        </div>
      </div>

      {/* Content */}
      <div className="flex-grow p-6">
        <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-sm p-6">
          {activeTab === 'announcements' && (
            <div className="min-h-[500px]">
              <ClassComponentWrapper 
                TeacherComponent={TeacherAnnouncements} 
                StudentComponent={StudentAnnouncements} 
                classId={classData._id} 
              />
            </div>
          )}
          {activeTab === 'notes' && (
            <div className="min-h-[500px]">
              <ClassComponentWrapper 
                TeacherComponent={TeacherNotes} 
                StudentComponent={StudentNotes} 
                classId={classData._id} 
              />
            </div>
          )}
          {activeTab === 'assignments' && (
            <div className="min-h-[500px]">
              <ClassComponentWrapper 
                TeacherComponent={TeacherAssignments} 
                StudentComponent={StudentAssignments} 
                classId={classData._id} 
              />
            </div>
          )}
          {activeTab === 'grading' && (
            <div className="min-h-[500px]">
              <ClassComponentWrapper 
                TeacherComponent={TeacherGrading} 
                StudentComponent={StudentGrades} 
                classId={classData._id} 
              />
            </div>
          )}
          {activeTab === 'people' && (
            <div className="min-h-[500px]">
              <ClassComponentWrapper 
                TeacherComponent={TeacherPeople} 
                StudentComponent={StudentPeople} 
                classId={classData._id} 
              />
            </div>
          )}
          {activeTab === 'myclasses' && (
            <div className="min-h-[500px] flex flex-col items-center justify-center text-gray-600">
              <Link to="/classes"><SiGoogleclassroom className="text-5xl mb-4" /></Link>
              </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClassPage;