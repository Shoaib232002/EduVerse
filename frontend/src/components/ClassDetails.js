import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { FaBook, FaClipboardList, FaTimes, FaUpload, FaBullhorn, FaUsers, FaGraduationCap } from 'react-icons/fa';
import TeacherNotes from './TeacherNotes';
import StudentNotes from './StudentNotes';
import TeacherAssignments from './TeacherAssignments';
import StudentAssignments from './StudentAssignments';
import TeacherGrading from './TeacherGrading';
import StudentGrading from './StudentGrading';

import TeacherAnnouncements from './TeacherAnnouncements';
import StudentAnnouncements from './StudentAnnouncements';
import TeacherPeople from './TeacherPeople';
import StudentPeople from './StudentPeople';
import ClassComponentWrapper from './ClassComponentWrapper';

const TabButton = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 font-medium rounded-t-lg ${
      active
        ? 'bg-white text-blue-600 border-t-2 border-blue-600'
        : 'text-gray-600 hover:text-blue-600'
    }`}
  >
    {children}
  </button>
);

const ClassDetails = ({ classData, onClose }) => {
  const [activeTab, setActiveTab] = useState('announcements');
  const { user } = useSelector((state) => state.auth);
  const isTeacher = classData.teacher === user?._id;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto py-8 ">
      <div className="bg-gray-100 rounded-lg w-full max-w-4xl mx-4 my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className={`${classData.headerColor || 'bg-blue-600'} p-6 rounded-t-lg text-white relative flex-shrink-0`}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:bg-white/20 p-2 rounded-full transition-colors"
          >
            <FaTimes />
          </button>
          <h2 className="text-2xl font-bold">{classData.name}</h2>
          <p className="opacity-90">
            <span>{classData.subject}</span>
            {classData.teacher?.name && (
              <>
                <span className="mx-2">•</span>
                <span>Teacher: {classData.teacher.name}</span>
              </>
            )}
          </p>
          <div className="flex items-center gap-4 opacity-90">
            <p>Room {classData.room}</p>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-white/20 rounded">Class Code: {classData.joinCode}</span>
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

        {/* Tabs */}
        <div className="bg-gray-200 px-6 flex gap-4 flex-shrink-0 overflow-x-auto">
          <TabButton
            active={activeTab === 'announcements'}
            onClick={() => setActiveTab('announcements')}
          >
            <div className="flex items-center gap-2 min-w-[120px] justify-center">
              <FaBullhorn /> Announcements
            </div>
          </TabButton>
          <TabButton
            active={activeTab === 'notes'}
            onClick={() => setActiveTab('notes')}
          >
            <div className="flex items-center gap-2 min-w-[120px] justify-center">
              <FaBook /> Notes
            </div>
          </TabButton>
          <TabButton
            active={activeTab === 'assignments'}
            onClick={() => setActiveTab('assignments')}
          >
            <div className="flex items-center gap-2 min-w-[120px] justify-center">
              <FaClipboardList /> Assignments
            </div>
          </TabButton>
          <TabButton
            active={activeTab === 'grading'}
            onClick={() => setActiveTab('grading')}
          >
            <div className="flex items-center gap-2 min-w-[120px] justify-center">
              <FaGraduationCap /> Grading
            </div>
          </TabButton>

          <TabButton
            active={activeTab === 'people'}
            onClick={() => setActiveTab('people')}
          >
            <div className="flex items-center gap-2 min-w-[120px] justify-center">
              <FaUsers /> People
            </div>
          </TabButton>
        </div>

        {/* Content */}
        <div className="bg-white p-6 rounded-b-lg flex-grow overflow-y-auto">
          <div className="max-w-3xl mx-auto">
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
                  StudentComponent={StudentGrading} 
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClassDetails;
