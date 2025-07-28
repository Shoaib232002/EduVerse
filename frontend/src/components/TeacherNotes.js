import React, { useState } from 'react';

const TeacherNotes = ({ classId }) => {
  const [file, setFile] = useState(null);
  const handleUpload = () => {
    // Implement upload logic
  };
  return (
    <div>
      <h3 className="font-semibold mb-2">Share Notes</h3>
      <input type="file" onChange={e => setFile(e.target.files[0])} />
      <button className="bg-green-500 text-white px-3 py-1 rounded ml-2" onClick={handleUpload}>Upload</button>
      {/* List of uploaded notes */}
    </div>
  );
};
export default TeacherNotes;