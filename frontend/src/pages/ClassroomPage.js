import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../services/api';
import io from 'socket.io-client';
import { FaHandPaper, FaVolumeMute, FaVolumeUp } from 'react-icons/fa';
import ClassroomWhiteboard from '../components/ClassroomWhiteboard';
import ClassroomChat from '../components/ClassroomChat';
import ClassroomVideo from '../components/ClassroomVideo';

const ClassroomPage = () => {
  const navigate = useNavigate();
  const { id: classId } = useParams();
  const { user } = useSelector((state) => state.auth);
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [socket, setSocket] = useState(null);
  const [muted, setMuted] = useState(false);
  const [raisedHand, setRaisedHand] = useState(false);
  const [classData, setClassData] = useState(null);
  const [videoEnabled, setVideoEnabled] = useState(true);

  // Mute/unmute self
  const handleMuteToggle = () => {
    if (socket && meeting?.active && user) {
      socket.emit('meeting-mute', { meetingId: classId, userId: user._id, muted: !muted });
      setMuted(!muted);
    }
  };

  // Toggle video
  const handleVideoToggle = () => {
    if (socket && meeting?.active && user) {
      socket.emit('meeting-video-toggle', { meetingId: classId, userId: user._id, videoEnabled: !videoEnabled });
      setVideoEnabled(!videoEnabled);
    }
  };
  // Raise/lower hand (student)
  const handleRaiseHandToggle = () => {
    if (socket && meeting?.active && user) {
      socket.emit('meeting-raise-hand', { meetingId: classId, userId: user._id, raisedHand: !raisedHand });
      setRaisedHand(!raisedHand);
    }
  };
  // Teacher: mute all
  const handleMuteAll = () => {
    if (socket && meeting?.active && user?.role === 'teacher') {
      participants.forEach(p => {
        if (p.role !== 'teacher') {
          socket.emit('meeting-mute', { meetingId: classId, userId: p._id, muted: true });
        }
      });
    }
  };

  // Emit socket event when teacher opens/closes whiteboard
  useEffect(() => {
    if (!socket || user?.role !== 'teacher') return;
    socket.emit('whiteboard-visibility', { meetingId: classId, open: showWhiteboard });
  }, [showWhiteboard, socket, user, classId]);
  // Socket.io for live participants and whiteboard visibility
  useEffect(() => {
    if (!meeting?.active || !user || !classId) return;
    const SOCKET_URL = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';
    const s = io(SOCKET_URL);
    setSocket(s);
    s.emit('joinClass', { classId, userId: user._id });
    s.emit('meeting-join', { meetingId: classId, user });
    s.on('meeting-participants', (list) => {
      setParticipants(list);
    });
    // Listen for teacher whiteboard visibility
    s.on('whiteboard-visibility', ({ open }) => {
      if (user.role !== 'teacher') setShowWhiteboard(open);
    });
    // Request initial participants list
    s.emit('get-meeting-participants', { meetingId: classId });
    return () => {
      s.emit('meeting-leave', { meetingId: classId, userId: user._id });
      s.disconnect();
    };
  }, [meeting?.active, user, classId]);

  useEffect(() => {
    const fetchClassAndMeeting = async () => {
      setLoading(true);
      setError(null);
      try {
        // Get class by ID
        const classRes = await api.get(`/classes/${classId}`);
        setClassData(classRes.data.data);
        const meetingId = classRes.data.data?.meeting?._id || classRes.data.data?.meeting;
        if (meetingId) {
          const meetingRes = await api.get(`/meetings/${meetingId}`);
          setMeeting(meetingRes.data.data);
        } else {
          setMeeting(null);
        }
      } catch (err) {
        setError('Failed to load classroom or meeting info');
      } finally {
        setLoading(false);
      }
    };
    if (classId) fetchClassAndMeeting();
  }, [classId]);

  // Start/end meeting handlers (teacher only)
  const handleStartMeeting = async () => {
    try {
      setLoading(true);
      const meetingId = classData?.meeting?._id || classData?.meeting;
      await api.post(`/meetings/${meetingId}/start`);
      // Refetch meeting info
      const res = await api.get(`/meetings/${meetingId}`);
      setMeeting(res.data.data);
    } catch (err) {
      setError('Failed to start meeting');
    } finally {
      setLoading(false);
    }
  };
  const handleEndMeeting = async () => {
    try {
      setLoading(true);
      const meetingId = classData?.meeting?._id || classData?.meeting;
      await api.post(`/meetings/${meetingId}/end`);
      // Refetch meeting info
      const res = await api.get(`/meetings/${meetingId}`);
      setMeeting(res.data.data);
    } catch (err) {
      setError('Failed to end meeting');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <div className="pt-24 p-10 text-center text-gray-500">Please log in to access the classroom.</div>;
  }
  if (loading) {
    return <div className="pt-24 p-10 text-center text-gray-500">Loading meeting...</div>;
  }
  if (error) {
    return <div className="pt-24 p-10 text-center text-red-500">{error}</div>;
  }

  // Teacher view
  if (user.role === 'teacher') { 
    return (
      <div className="pt-16 bg-gray-100 min-h-screen flex flex-col">
        <div className="flex justify-between items-center px-8 py-4 bg-white shadow-md">
          <h1 className="text-2xl font-bold text-gray-800">EduVerse Meeting</h1>
          <div className="flex gap-4">
            {!meeting?.active ? (
              <button onClick={handleStartMeeting} className="bg-green-600 text-white px-6 py-2 rounded-xl text-lg">Start Meeting</button>
            ) : (
              <button onClick={handleEndMeeting} className="bg-red-600 text-white px-6 py-2 rounded-xl text-lg">End Meeting</button>
            )}
            <span className={`px-4 py-2 rounded-xl text-lg ${meeting?.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              {meeting?.active ? 'Live' : 'Not Active'}
            </span>
          </div>
        </div>
        {/* Main Zoom-like layout */}
        <div className="flex flex-1 overflow-hidden relative">
          {/* Video grid center */}
          <div className="flex-1 flex flex-col items-center justify-center bg-gray-200 p-4">
            {meeting?.active && (
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-full h-full max-w-[90vw] max-h-[80vh] bg-black rounded-2xl flex flex-wrap items-center justify-center gap-6 p-6 shadow-2xl" style={{ minWidth: 0, minHeight: 0 }}>
                  <ClassroomVideo classId={classId} largeGrid videoEnabled={videoEnabled} />
                </div>
              </div>
            )}
          </div>
          {/* Sidebar: Chat, Participants, Controls */}
          <div className="w-[350px] min-w-[300px] max-w-[400px] bg-white h-full flex flex-col border-l shadow-xl" style={{ zIndex: 20, position: 'relative' }}>
            {meeting?.active && (
              <div className="flex-1 overflow-y-auto p-4">
                <ClassroomChat classId={classId} />
              </div>
            )}
            <div className="p-4 border-t">
              <h2 className="text-lg font-semibold mb-2 text-gray-800">Participants</h2>
              {meeting?.active ? (
                <ul className="space-y-2">
                  {participants.length === 0 && <li className="text-gray-400">No one joined yet.</li>}
                  {participants.map((p) => (
                    <li key={p._id} className="flex items-center gap-2">
                      <span className={`inline-block w-2 h-2 rounded-full ${p.role === 'teacher' ? 'bg-blue-600' : 'bg-green-600'}`}></span>
                      <span className="font-medium">{p.name || p.email}</span>
                      {p.role === 'teacher' && <span className="text-xs text-blue-600 ml-2">(Host)</span>}
                      {/* Audio Status */}
                      {p.muted ? (
                        <FaVolumeMute className="text-red-500 ml-2" title="Muted" />
                      ) : (
                        <FaVolumeUp className="text-green-500 ml-2" title="Unmuted" />
                      )}
                      {/* Video Status */}
                      {p.videoEnabled ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-500 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2zM3 3l18 18" />
                        </svg>
                      )}
                      {/* Raised Hand Status */}
                      {p.raisedHand && <FaHandPaper className="text-yellow-500 ml-2" title="Raised Hand" />}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 italic">Meeting not active.</p>
              )}
            </div>
            {meeting?.active && (
              <div className="p-4 border-t">
                <h2 className="text-lg font-semibold mb-2 text-gray-800">Controls</h2>
                <div className="flex flex-wrap gap-2">
                  <button onClick={handleMuteToggle} className={`bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition flex items-center gap-2 ${muted ? 'opacity-70' : ''}`}>
                    {muted ? <FaVolumeMute /> : <FaVolumeUp />}
                    {muted ? 'Unmute' : 'Mute'}
                  </button>
                  <button onClick={handleVideoToggle} className={`bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition flex items-center gap-2 ${!videoEnabled ? 'opacity-70' : ''}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      {videoEnabled ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2zM3 3l18 18" />
                      )}
                    </svg>
                    {videoEnabled ? 'Turn Off Video' : 'Turn On Video'}
                  </button>
                  <button onClick={handleMuteAll} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition">Mute All</button>
                  <button onClick={() => setShowWhiteboard(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition">Whiteboard</button>
                </div>
              </div>
            )}
          </div>
          {/* Whiteboard modal/tab */}
          {meeting?.active && showWhiteboard && user.role === 'teacher' && (
            <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
              <div className="relative w-[90%] h-[80%] max-w-[1200px] bg-white rounded-2xl shadow-2xl border p-4 flex flex-col" style={{ maxHeight: '90vh' }}>
                <button
                  onClick={() => {
                    setShowWhiteboard(false);
                    if (socket) {
                      socket.emit('whiteboard-visibility', { meetingId: classId, open: false });
                    }
                  }}
                  className="absolute top-4 right-4 bg-red-500 text-white px-4 py-2 rounded shadow-lg hover:bg-red-600 transition-colors"
                  style={{ zIndex: 10 }}
                >Close</button>
                <div className="pt-8 pb-4 px-2 flex-1 flex flex-col justify-center items-center overflow-auto">
                  <ClassroomWhiteboard classId={classId} viewOnly={user.role !== 'teacher'} width={800} height={400} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  const handleExitMeeting = () => {
    if (socket) {
      socket.emit('meeting-leave', { meetingId: classId, userId: user._id });
      socket.disconnect();
      setSocket(null);
    }
    navigate('/student-dashboard'); // or any route you want to send students to
  };
  return (
    <div className="pt-16 bg-gray-100 min-h-screen flex flex-col">
      <div className="flex justify-between items-center px-8 py-4 bg-white shadow-md">
        <h1 className="text-2xl font-bold text-gray-800">EduVerse Meeting</h1>
        <div className="flex gap-4">
          <span className={`px-4 py-2 rounded-xl text-lg ${meeting?.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
            {meeting?.active ? 'Live' : 'Not Active'}
          </span>
          {meeting?.active && (
            <button onClick={handleExitMeeting} className="bg-red-500 text-white px-4 py-2 rounded-xl ml-4">Exit Meeting</button>
          )}
        </div>
      </div>
      {/* Main Zoom-like layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Video grid center */}
        <div className="flex-1 flex flex-col items-center justify-center bg-gray-200 p-4 relative">
          {meeting?.active && (
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-full h-full max-w-[90vw] max-h-[80vh] bg-black rounded-2xl flex flex-wrap items-center justify-center gap-6 p-6 shadow-2xl">
                {/* Only show video if whiteboard is not active or user is teacher */}
                {/* Always show ClassroomVideo for students, even when whiteboard is active */}
                <ClassroomVideo classId={classId} largeGrid videoEnabled={videoEnabled} />
                
                {/* Full-screen whiteboard for students when teacher opens it */}
                {meeting?.active && showWhiteboard && user.role !== 'teacher' && (
                  <div className="absolute inset-0 bg-white bg-opacity-90 rounded flex items-center justify-center overflow-hidden" style={{ zIndex: 10 }}>
                    <div className="relative w-full h-full flex flex-col items-center justify-center">
                      <div className="absolute top-4 right-4">
                        <button 
                          onClick={() => setShowWhiteboard(false)}
                          className="bg-red-500 text-white px-4 py-2 rounded shadow-lg hover:bg-red-600 transition-colors"
                        >Close</button>
                      </div>
                      <ClassroomWhiteboard 
                        classId={classId} 
                        viewOnly 
                        width={800} 
                        height={400} 
                        scaleToFit={true}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        {/* Sidebar: Chat, Participants, Controls */}
        <div className="w-[350px] min-w-[300px] max-w-[400px] bg-white h-full flex flex-col border-l shadow-xl">
          {meeting?.active && (
            <div className="flex-1 overflow-y-auto p-4">
              <ClassroomChat classId={classId} />
            </div>
          )}
          <div className="p-4 border-t">
            <h2 className="text-lg font-semibold mb-2 text-gray-800">Participants</h2>
            {meeting?.active ? (
              <ul className="space-y-2">
                {participants.length === 0 && <li className="text-gray-400">No one joined yet.</li>}
                {participants.map((p) => (
                  <li key={p._id} className="flex items-center gap-2">
                    <span className={`inline-block w-2 h-2 rounded-full ${p.role === 'teacher' ? 'bg-blue-600' : 'bg-green-600'}`}></span>
                    <span className="font-medium">{p.name || p.email}</span>
                    {p.role === 'teacher' && <span className="text-xs text-blue-600 ml-2">(Host)</span>}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 italic">Meeting not active.</p>
            )}
          </div>
          {meeting?.active && (
            <div className="p-4 border-t">
              <h2 className="text-lg font-semibold mb-2 text-gray-800">Controls</h2>
              <div className="flex flex-wrap gap-2">
                <button onClick={handleMuteToggle} className={`bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition flex items-center gap-2 ${muted ? 'opacity-70' : ''}`}>
                  {muted ? <FaVolumeMute /> : <FaVolumeUp />}
                  {muted ? 'Unmute' : 'Mute'}
                </button>
                <button onClick={handleVideoToggle} className={`bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition flex items-center gap-2 ${!videoEnabled ? 'opacity-70' : ''}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {videoEnabled ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2zM3 3l18 18" />
                    )}
                  </svg>
                  {videoEnabled ? 'Turn Off Video' : 'Turn On Video'}
                </button>
                <button onClick={handleRaiseHandToggle} className={`bg-yellow-400 hover:bg-yellow-500 text-white px-4 py-2 rounded-xl transition flex items-center gap-2 ${raisedHand ? 'opacity-70' : ''}`}>
                  <FaHandPaper />
                  {raisedHand ? 'Lower Hand' : 'Raise Hand'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClassroomPage;
