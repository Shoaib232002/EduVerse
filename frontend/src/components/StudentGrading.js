import React from 'react';
import { FaGraduationCap } from 'react-icons/fa';

const StudentGrading = ({ classId }) => {
  return (
    <div className="bg-white rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-6">Grades</h2>
      <div className="space-y-6">
        {/* Empty State */}
        <div className="text-center py-8 text-gray-500">
          <FaGraduationCap className="mx-auto text-5xl text-gray-400 mb-4" />
          <p className="text-lg font-medium text-gray-600 mb-2">No Grades Available</p>
          <p>Your grades will appear here once your teacher has graded your assignments.</p>
        </div>
      </div>
    </div>
  );
};

export default StudentGrading;