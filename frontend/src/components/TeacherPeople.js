import React from 'react';
import { FaUserGraduate, FaChalkboardTeacher, FaUserPlus } from 'react-icons/fa';
import ClassComponentWrapper from './ClassComponentWrapper';

const TeacherPeople = ({ classId }) => {
  const handleInvite = () => {
    // TODO: Implement invite functionality
    navigator.clipboard.writeText(window.location.origin + '/join/' + classId);
  };

  return (
    <ClassComponentWrapper title="Class Participants">
      {/* Teachers Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
            <FaChalkboardTeacher className="text-gray-500" /> Teachers
          </h3>
          {/* Teacher actions could go here */}
        </div>
        <div className="divide-y">
          {/* Teacher list will be mapped here */}
          <div className="py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-blue-600 font-semibold">JD</span>
              </div>
              <div>
                <p className="font-medium">John Doe</p>
                <p className="text-sm text-gray-500">john.doe@example.com</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Students Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
            <FaUserGraduate className="text-gray-500" /> Students
          </h3>
          <button
            onClick={handleInvite}
            className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
          >
            <FaUserPlus /> Invite Students
          </button>
        </div>
        <div className="divide-y">
          {/* Student list will be mapped here */}
          <div className="text-center py-8 text-gray-500">
            No students enrolled yet.
            <button
              onClick={handleInvite}
              className="block mx-auto mt-2 text-blue-600 hover:text-blue-700"
            >
              Invite students to join
            </button>
          </div>
        </div>
      </div>
    </ClassComponentWrapper>
  );
};

export default TeacherPeople;
