import React from 'react';
import { FaUserGraduate, FaChalkboardTeacher } from 'react-icons/fa';
import { useSelector } from 'react-redux';

const StudentPeople = ({ classId }) => {
  const { current: classData } = useSelector((state) => state.classes);

  // Get initials from name
  const getInitials = (name) => {
    if (!name) return 'NA';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  return (
    <div className="bg-white rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-6">Class Participants</h2>
      {/* Teachers Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
            <FaChalkboardTeacher className="text-gray-500" /> Teachers
          </h3>
        </div>
        <div className="divide-y">
          {classData?.teacher ? (
            <div className="py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-blue-600 font-semibold">{getInitials(classData.teacher.name)}</span>
                </div>
                <div>
                  <p className="font-medium">{classData.teacher.name}</p>
                  <p className="text-sm text-gray-500">{classData.teacher.email}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-3 text-gray-500">No teacher information available</div>
          )}
        </div>
      </div>

      {/* Students Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
            <FaUserGraduate className="text-gray-500" /> Students
          </h3>
        </div>
        <div className="divide-y">
          {classData?.students && classData.students.length > 0 ? (
            classData.students.map((student) => (
              <div key={student._id} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-blue-600 font-semibold">{getInitials(student.name)}</span>
                  </div>
                  <div>
                    <p className="font-medium">{student.name}</p>
                    <p className="text-sm text-gray-500">{student.email}</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-3 text-gray-500">No students enrolled yet.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentPeople;