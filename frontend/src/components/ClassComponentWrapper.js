import React from 'react';

const ClassComponentWrapper = ({ title, children }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="border-b px-6 py-4">
        <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
      </div>
      <div className="p-6">
        {children}
      </div>
    </div>
  );
};

export default ClassComponentWrapper;
