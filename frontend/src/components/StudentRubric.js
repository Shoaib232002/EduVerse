import React from 'react';
import { FaRuler } from 'react-icons/fa';

const StudentRubric = ({ classId }) => {
  return (
    <div className="bg-white rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-6">Rubrics</h2>
      <div className="space-y-6">
        {/* Empty State */}
        <div className="text-center py-8 text-gray-500">
          <p>No rubrics available for this class.</p>
        </div>
      </div>
    </div>
  );
};

export default StudentRubric;