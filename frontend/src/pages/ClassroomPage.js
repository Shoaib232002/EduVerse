import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../services/api';
import io from 'socket.io-client';
import { FaHandPaper, FaVolumeMute, FaVolumeUp } from 'react-icons/fa';
import ClassroomChat from '../components/ClassroomChat';
import ClassroomVideo from '../components/ClassroomVideo';

// Avatar helpers for participant list
const getInitials = (name) => {
  if (!name) return '?';
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};
const getAvatarColor = (name) => {
  const colors = [
    'bg-gradient-to-br from-red-500 to-red-600',
    'bg-gradient-to-br from-blue-500 to-blue-600',
    'bg-gradient-to-br from-green-500 to-green-600',
    'bg-gradient-to-br from-yellow-500 to-yellow-600',
    'bg-gradient-to-br from-purple-500 to-purple-600',
    'bg-gradient-to-br from-pink-500 to-pink-600',
    'bg-gradient-to-br from-indigo-500 to-indigo-600',
    'bg-gradient-to-br from-teal-500 to-teal-600'
  ];
  if (!name) return colors[0];
  const hash = name.split('').reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0);
  return colors[Math.abs(hash) % colors.length];
};

const ClassroomPage = () => {
  const navigate = useNavigate();
  const { id: classId } = useParams();
  const { user } = useSelector((state) => state.auth);
  // Removed whiteboard state
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

  // Removed whiteboard sync logic
  
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

    // Listen for individual participant updates
    s.on('participant-updated', (updatedParticipant) => {
      setParticipants(prevParticipants => 
        prevParticipants.map(p => 
          p._id === updatedParticipant._id ? updatedParticipant : p
        )
      );
    });

    // Removed whiteboard socket listeners

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
      
      // Emit socket event to clear messages and notify users
      if (socket && meetingId) {
        socket.emit('meeting-end', { meetingId, classId });
      }
      
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
    return (
      <div className="pt-24 px-6 min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-xl text-gray-600">Please log in to access the classroom.</p>
        </div>
      </div>
    );
  }
  
  if (loading) {
    return (
      <div className="pt-24 px-6 min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-xl text-gray-600">Loading meeting...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="pt-24 px-6 min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-xl text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  // Shared layout for both teacher and student
  const handleExitMeeting = () => {
    if (socket) {
      socket.emit('meeting-leave', { meetingId: classId, userId: user._id });
      socket.disconnect();
      setSocket(null);
    }
    navigate('/student-dashboard');
  };

  return (
    <div className="pt-16 bg-gray-50 min-h-screen flex flex-col">
      {/* Header Bar */}
      <div className="flex justify-between items-center px-6 py-3 bg-white shadow-sm border-b border-gray-200">
        <h1 className="text-xl font-semibold text-gray-900">EduVerse Meeting</h1>
        <div className="flex items-center gap-3">
          <span className={`px-4 py-2 rounded-lg text-sm font-medium ${meeting?.active ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-600 border border-gray-200'}`}>
            {meeting?.active ? '● Live' : 'Not Active'}
          </span>
          {user.role === 'teacher' && (
            <>
              {!meeting?.active ? (
                <button 
                  onClick={handleStartMeeting} 
                  className="bg-green-600 hover:bg-green-700 text-white font-medium px-5 py-2 rounded-lg text-sm transition-colors"
                >
                  Start Meeting
                </button>
              ) : (
                <button 
                  onClick={handleEndMeeting} 
                  className="bg-red-600 hover:bg-red-700 text-white font-medium px-5 py-2 rounded-lg text-sm transition-colors"
                >
                  End Meeting
                </button>
              )}
            </>
          )}
          {meeting?.active && user.role === 'student' && (
            <button 
              onClick={handleExitMeeting} 
              className="bg-red-500 hover:bg-red-600 text-white font-medium px-5 py-2 rounded-lg text-sm transition-colors"
            >
              Exit Meeting
            </button>
          )}
          {!meeting?.active && user.role === 'student' && (
            <span className="text-gray-500 text-sm font-medium">
              Waiting for teacher to start...
            </span>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Video Display Center */}
        <div className="flex-1 flex items-center justify-center bg-gray-900 p-6 relative">
          {meeting?.active ? (
            <div className="w-full h-full max-w-[95vw] max-h-[85vh] bg-black rounded-xl overflow-hidden shadow-2xl relative">
              {user.role === 'student' && (
                <div className="w-full h-full flex items-center justify-center">
                  <ClassroomVideo classId={classId} largeGrid videoEnabled={videoEnabled} studentView={true} participants={participants} />
                </div>
              )}
              {user.role === 'teacher' && (
                <ClassroomVideo classId={classId} largeGrid videoEnabled={videoEnabled} participants={participants} />
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-white mb-2">Meeting Not Active</h2>
                {user.role === 'teacher' ? (
                  <p className="text-gray-300">Click "Start Meeting" in the header to begin the session.</p>
                ) : (
                  <p className="text-gray-300">Waiting for the teacher to start the meeting...</p>
                )}
              </div>
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="w-96 bg-white flex flex-col border-l border-gray-200 shadow-lg">
          {/* Chat Section */}
          {meeting?.active && (
            <div className="flex-1 overflow-hidden flex flex-col border-b border-gray-200">
              <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                <h2 className="text-sm font-semibold text-gray-900">Chat</h2>
              </div>
              <div className="flex-1 overflow-y-auto px-4 py-3">
                <ClassroomChat classId={classId} />
              </div>
            </div>
          )}

          {/* Participants Section */}
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Participants ({meeting?.active ? participants.length : 0})</h2>
            {meeting?.active ? (
              <ul className="space-y-2 max-h-40 overflow-y-auto">
                {participants.length === 0 && (
                  <li className="text-sm text-gray-500 italic">No participants yet</li>
                )}
                {participants.map((p) => (
                  <li key={p._id} className="flex items-center gap-2 text-sm">
                    {user.role === 'teacher' && (
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs shadow ${getAvatarColor(p.name)} select-none`}>
                        {getInitials(p.name)}
                      </span>
                    )}
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${p.role === 'teacher' ? 'bg-blue-500' : 'bg-green-500'}`}></span>
                    <span className="font-medium text-gray-900 truncate flex-1">{p.name || p.email}</span>
                    {p.role === 'teacher' && (
                      <span className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded">Host</span>
                    )}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {p.muted ? (
                        <FaVolumeMute className="text-red-500 w-3.5 h-3.5" title="Muted" />
                      ) : (
                        <FaVolumeUp className="text-green-500 w-3.5 h-3.5" title="Unmuted" />
                      )}
                      {p.videoEnabled ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2zM3 3l18 18" />
                        </svg>
                      )}
                      {p.raisedHand && <FaHandPaper className="text-yellow-500 w-3.5 h-3.5" title="Raised Hand" />}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500 italic">Meeting not active</p>
            )}
          </div>

          {/* Controls Section */}
          {meeting?.active ? (
            <div className="px-4 py-4 bg-white">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">Meeting Controls</h2>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={handleMuteToggle} 
                  className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${muted ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                >
                  {muted ? <FaVolumeMute className="w-4 h-4" /> : <FaVolumeUp className="w-4 h-4" />}
                  <span>{muted ? 'Unmute' : 'Mute'}</span>
                </button>
                <button 
                  onClick={handleVideoToggle} 
                  className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${!videoEnabled ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {videoEnabled ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2zM3 3l18 18" />
                    )}
                  </svg>
                  <span>{videoEnabled ? 'Stop' : 'Start'}</span>
                </button>
                {user.role === 'teacher' && (
                  <button 
                    onClick={handleMuteAll} 
                    className="col-span-2 bg-gray-100 hover:bg-gray-200 text-gray-900 font-medium px-3 py-2.5 rounded-lg text-sm transition-colors"
                  >
                    Mute All Participants
                  </button>
                )}
                {user.role === 'student' && (
                  <button 
                    onClick={handleRaiseHandToggle} 
                    className={`col-span-2 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${raisedHand ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' : 'bg-yellow-500 text-white hover:bg-yellow-600'}`}
                  >
                    <FaHandPaper className="w-4 h-4" />
                    <span>{raisedHand ? 'Lower Hand' : 'Raise Hand'}</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="px-4 py-4 bg-white border-t border-gray-200 text-center">
              <p className="text-sm text-gray-500">
                {user.role === 'teacher' 
                  ? 'Start the meeting to enable controls' 
                  : 'Meeting controls available when teacher starts the session'}
              </p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default ClassroomPage;