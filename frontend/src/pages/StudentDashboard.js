import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { FaBook, FaClipboardCheck, FaBullhorn, FaGraduationCap, FaChalkboardTeacher } from 'react-icons/fa';
import StudentClasses from '../components/StudentClasses';
import StudentAssignments from '../components/StudentAssignments';
import StudentGrades from '../components/StudentGrades';
import StudentNotes from '../components/StudentNotes';
import StudentAnnouncements from '../components/StudentAnnouncements';

const StudentDashboard = () => {
  const { current: selectedClass } = useSelector((state) => state.classes);
  const [activeTab, setActiveTab] = useState('overview');

  const renderContent = () => {
    if (!selectedClass) {
      return (
        <div className="text-center py-16">
          <FaChalkboardTeacher className="text-6xl text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-600 mb-2">Welcome to EduVerse!</h2>
          <p className="text-gray-500 max-w-md mx-auto">
            Select a class from your enrolled classes to view assignments, notes, announcements, and more.
          </p>
        </div>
      );
    }

    switch (activeTab) {
      case 'overview':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <StudentAnnouncements classId={selectedClass._id} />
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <StudentAssignments classId={selectedClass._id} />
            </div>
          </div>
        );
      case 'assignments':
        return (
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <StudentAssignments classId={selectedClass._id} />
          </div>
        );
      case 'notes':
        return (
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <StudentNotes classId={selectedClass._id} />
          </div>
        );
      case 'grades':
        return (
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <StudentGrades classId={selectedClass._id} />
          </div>
        );
      case 'announcements':
        return (
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <StudentAnnouncements classId={selectedClass._id} />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="pt-24 p-6 md:p-10 bg-gradient-to-br from-green-50 via-white to-blue-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Left Sidebar */}
          <div className="md:w-1/4">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <StudentClasses />
            </div>
          </div>

          {/* Main Content */}
          <div className="md:w-3/4">
            {selectedClass && (
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800 mb-2">{selectedClass.name}</h1>
                <p className="text-gray-600">{selectedClass.description}</p>
              </div>
            )}

            {/* Tabs */}
            {selectedClass && (
              <div className="mb-6 border-b">
                <nav className="flex gap-4">
                  {[
                    { id: 'overview', label: 'Overview', icon: FaChalkboardTeacher },
                    { id: 'assignments', label: 'Assignments', icon: FaClipboardCheck },
                    { id: 'notes', label: 'Notes', icon: FaBook },
                    { id: 'grades', label: 'Grades', icon: FaGraduationCap },
                    { id: 'announcements', label: 'Announcements', icon: FaBullhorn },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-4 py-2 font-medium transition-colors border-b-2 -mb-px
                        ${activeTab === tab.id
                          ? 'text-blue-600 border-blue-600'
                          : 'text-gray-500 border-transparent hover:text-blue-600 hover:border-blue-300'
                        }`}
                    >
                      <tab.icon className="text-sm" />
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>
            )}

            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
