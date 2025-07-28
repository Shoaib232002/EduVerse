import React from 'react';
import { useParams } from 'react-router-dom';
import ClassroomWhiteboard from '../components/ClassroomWhiteboard';
import ClassroomChat from '../components/ClassroomChat';
import ClassroomVideo from '../components/ClassroomVideo';

const ClassroomPage = () => {
  const { id: classId } = useParams();

  return (
    <div className="pt-24 p-6 md:p-10 bg-gradient-to-br from-indigo-50 via-white to-blue-50 min-h-screen">
      <h1 className="text-3xl font-extrabold text-gray-800 mb-6 mt-10 text-center">Virtual Classroom</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Video + Whiteboard Area */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-4 md:p-6 rounded-2xl shadow-xl hover:shadow-2xl transition">
            <ClassroomVideo classId={classId} />
          </div>

          <div className="bg-white p-4 md:p-6 rounded-2xl shadow-xl hover:shadow-2xl transition">
            <ClassroomWhiteboard classId={classId} />
          </div>
        </div>

        {/* Sidebar: Chat + Participants + Controls */}
        <div className="space-y-6">
          <div className="bg-white p-4 md:p-6 rounded-2xl shadow-lg hover:shadow-2xl transition">
            <ClassroomChat classId={classId} />
          </div>

          <div className="bg-white p-4 md:p-6 rounded-2xl shadow-lg hover:shadow-2xl transition">
            <h2 className="text-lg font-semibold mb-2 text-gray-800">Participants</h2>
            {/* TODO: Participants list */}
            <p className="text-gray-500 italic">Coming soon...</p>
          </div>

          <div className="bg-white p-4 md:p-6 rounded-2xl shadow-lg hover:shadow-2xl transition">
            <h2 className="text-lg font-semibold mb-2 text-gray-800">Controls</h2>
            <div className="flex flex-wrap gap-2">
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition">
                Raise Hand
              </button>
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition">
                Mute
              </button>
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition">
                Share Screen
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClassroomPage;
