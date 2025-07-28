import React from 'react';
import { useSelector } from 'react-redux';
import StudentClasses from '../components/StudentClasses';
import StudentAssignments from '../components/StudentAssignments';
import StudentGrades from '../components/StudentGrades';
import StudentNotes from '../components/StudentNotes';

const StudentDashboard = () => {
  const { current: selectedClass } = useSelector((state) => state.classes);

  return (
    <div className="pt-24 p-6 md:p-10 bg-gradient-to-br from-green-50 via-white to-blue-50 min-h-screen">
      <h1 className="text-3xl font-extrabold text-gray-800 mb-6 mt-10 text-center">Student Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition duration-300">
          <StudentClasses />
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition duration-300">
          {selectedClass ? (
            <StudentAssignments classId={selectedClass._id} />
          ) : (
            <div className="text-gray-500 italic">Select a class to view assignments.</div>
          )}
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition duration-300">
          {selectedClass ? (
            <StudentNotes classId={selectedClass._id} />
          ) : (
            <div className="text-gray-500 italic">Select a class to download notes.</div>
          )}
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition duration-300 md:col-span-2">
          <h2 className="text-xl font-semibold mb-3 text-gray-800">Grades</h2>
          {selectedClass ? (
            <StudentGrades classId={selectedClass._id} />
          ) : (
            <div className="text-gray-500 italic">Select a class to view grades.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
