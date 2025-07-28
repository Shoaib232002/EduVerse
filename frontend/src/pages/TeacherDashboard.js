import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import TeacherClasses from '../components/TeacherClasses';
import TeacherAssignments from '../components/TeacherAssignments';
import TeacherGrading from '../components/TeacherGrading';
import TeacherNotes from '../components/TeacherNotes';

const TeacherDashboard = () => {
  const { current: selectedClass } = useSelector((state) => state.classes);
  const [copied, setCopied] = useState(false);

  const handleCopy = (link) => {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="pt-24 p-6 md:p-10 bg-gradient-to-br from-blue-50 via-white to-purple-50 min-h-screen">
      <h1 className="text-3xl mt-10 font-extrabold text-gray-800 mb-6 text-center">Teacher Dashboard</h1>

      {selectedClass && selectedClass.joinLink && (
        <div className="mb-6 bg-white border border-blue-200 rounded-xl p-4 shadow flex flex-wrap items-center gap-3 justify-between">
          <div className="flex flex-col md:flex-row md:items-center gap-2">
            <span className="font-semibold text-blue-700">Invite Link:</span>
            <a
              href={selectedClass.joinLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline break-all hover:text-blue-800 transition"
            >
              {selectedClass.joinLink}
            </a>
          </div>
          <button
            className={`text-sm font-medium px-3 py-1.5 rounded-lg transition ${
              copied
                ? 'bg-green-100 text-green-700 cursor-default'
                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
            }`}
            onClick={() => handleCopy(selectedClass.joinLink)}
            disabled={copied}
          >
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition duration-300">
          <TeacherClasses />
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition duration-300">
          {selectedClass ? (
            <TeacherAssignments classId={selectedClass._id} />
          ) : (
            <div className="text-gray-500 italic">Select a class to manage assignments.</div>
          )}
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition duration-300">
          {selectedClass ? (
            <TeacherNotes classId={selectedClass._id} />
          ) : (
            <div className="text-gray-500 italic">Select a class to share notes.</div>
          )}
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition duration-300 md:col-span-2">
          <h2 className="text-xl font-semibold mb-3 text-gray-800">Grade Students</h2>
          {selectedClass ? (
            <TeacherGrading classId={selectedClass._id} />
          ) : (
            <div className="text-gray-500 italic">Select a class to grade assignments.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
