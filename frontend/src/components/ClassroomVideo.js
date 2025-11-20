import React, { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import io from 'socket.io-client';

const SOCKET_URL = (process.env.REACT_APP_API_URL || 'http://localhost:5000').replace(/\/api\/?$/, '');
console.log('Connecting to socket URL:', SOCKET_URL);

const ClassroomVideo = ({ classId, largeGrid, videoEnabled = true, studentView = false, participants: participantsProp }) => {
  const { user } = useSelector((state) => state.auth);
  const [peers, setPeers] = useState({}); // { userId: { stream, ref, role } }
  const [localStream, setLocalStream] = useState(null);
  const socketRef = useRef();
  const peerConnections = useRef({});
  const videoTrackRef = useRef(null);

  // Always use participantsProp if provided, else fallback to internal state
  const [internalParticipants, setInternalParticipants] = useState([]);
  const participants = participantsProp || internalParticipants;
  const [videoStates, setVideoStates] = useState({}); // { userId: boolean }

  // Keep video grid in sync with participants prop in real time
  useEffect(() => {
    if (participantsProp) {
      setVideoStates(prevStates => {
        const newStates = { ...prevStates };
        participantsProp.forEach(p => {
          if (newStates[p._id] === undefined) {
            newStates[p._id] = p.videoEnabled !== false;
          }
        });
        Object.keys(newStates).forEach(id => {
          if (!participantsProp.find(p => p._id === id)) {
            delete newStates[id];
          }
        });
        return newStates;
      });
    }
  }, [participantsProp]);

  // Handle video state changes
  useEffect(() => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = videoEnabled;
        videoTrackRef.current = videoTrack;
      }
    }
  }, [videoEnabled, localStream]);

  useEffect(() => {
    if (!classId || !user) return;
    console.log('Initializing video connection for:', user.role);
    socketRef.current = io(SOCKET_URL, { transports: ['websocket'] });
    
    // Join class room
    socketRef.current.emit('joinClass', { classId, userId: user._id, role: user.role });
    console.log('Joined classroom:', classId);

    // Listen for connection status
    socketRef.current.on('connect', () => {
      console.log('Socket connected');
    });

    socketRef.current.on('error', (error) => {
      console.error('Socket error:', error);
    });

    // Join the meeting and notify others
    socketRef.current.emit('meeting-join', { 
      meetingId: classId, 
      user: { 
        _id: user._id, 
        name: user.name, 
        role: user.role 
      } 
    });
    console.log(`User ${user.name} (${user.role}) joined meeting ${classId}`);

    // Listen for meeting participants to get user info and video states
    // Only listen to socket if participantsProp is not provided
    if (!participantsProp) {
      socketRef.current.on('meeting-participants', (participantsList) => {
        console.log('Received participants:', participantsList);
        setInternalParticipants(participantsList);
        // ...rest of the logic unchanged...
      });
    }

    // Listen for meeting participants updates
    if (!participantsProp) {
      socketRef.current.on('meeting-participants', (data) => {
        console.log('Meeting participants updated:', data);
        setInternalParticipants(data.participants || []);
        // ...rest of the logic unchanged...
      });
    }


    // Listen for participant updates (video state changes, etc.)
    socketRef.current.on('participant-updated', (updatedParticipant) => {
      console.log('Participant updated:', updatedParticipant);
      setInternalParticipants(prevParticipants => {
        const updatedParticipants = prevParticipants.map(p => 
          p._id === updatedParticipant._id ? updatedParticipant : p
        );
        return updatedParticipants;
      });
      
      // Update video state
      setVideoStates(prevStates => ({
        ...prevStates,
        [updatedParticipant._id]: updatedParticipant.videoEnabled !== false
      }));
    });



    return () => {
      console.log('Cleaning up video connection');
      socketRef.current.disconnect();
      Object.values(peerConnections.current).forEach(pc => pc.close());
    };
  }, [classId, user]);

  useEffect(() => {
    if (!classId || !user) return;
    
    console.log('Requesting media access...');

    // Release existing stream if any
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }

    // Function to handle media access with optimizations
    async function setupMediaStream() {
      try {
        // First try to get existing active devices
        const devices = await navigator.mediaDevices.enumerateDevices();
        console.log('Available devices:', devices);
        
        const isLocalTesting = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        let stream;
        
        try {
          // Try to get media with optimized constraints for faster loading
          stream = await navigator.mediaDevices.getUserMedia({ 
            video: videoEnabled ? {
              width: { ideal: 640, max: 1280 }, // Start with lower resolution for faster connection
              height: { ideal: 480, max: 720 },
              frameRate: { ideal: 15, max: 30 } // Lower frame rate initially
            } : false,
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            }
          });
          console.log('Got real media stream with optimized settings');
          
        } catch (initialError) {
          console.error('Initial media access error:', initialError);
          
          if (isLocalTesting && initialError.name === 'NotReadableError') {
            console.log('Device in use, creating mock stream for testing...');
            const canvas = document.createElement('canvas');
            canvas.width = 640;
            canvas.height = 480;
            const ctx = canvas.getContext('2d');
            
            function drawFrame() {
              ctx.fillStyle = '#000000';
              ctx.fillRect(0, 0, canvas.width, canvas.height);
              ctx.fillStyle = '#FFFFFF';
              ctx.font = '20px Arial';
              ctx.fillText(user.role === 'teacher' ? 'Teacher Video' : 'Student Video', 20, 40);
              ctx.fillText(new Date().toLocaleTimeString(), 20, 70);
            }
            
            drawFrame();
            const mockStream = canvas.captureStream(30);
            setInterval(drawFrame, 1000);
            
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const dst = oscillator.connect(audioContext.createMediaStreamDestination());
            oscillator.start();
            mockStream.addTrack(dst.stream.getAudioTracks()[0]);
            
            stream = mockStream;
            console.log('Created mock stream for testing');
          } else {
            console.log('Trying audio-only as fallback...');
            try {
              stream = await navigator.mediaDevices.getUserMedia({ 
                video: false,
                audio: true
              });
              console.log('Got audio-only stream');
            } catch (audioError) {
              console.error('Audio fallback failed:', audioError);
              throw audioError;
            }
          }
        }
        
        if (!stream) {
          throw new Error('Failed to get any media stream');
        }

        console.log('Setting up stream:', stream.id);
        setLocalStream(stream);
        
        // For teacher, immediately notify others with priority
        if (user.role === 'teacher') {
          console.log('Teacher notifying students with priority');
          socketRef.current.emit('webrtc-offer', { 
            classId, 
            offer: null, 
            from: user._id,
            role: 'teacher'
          });
        }
        
        return stream;
      } catch (error) {
        console.error('Media access error:', error.name, error.message);
        
        // Handle specific error cases
        if (error.name === 'NotReadableError' || error.name === 'AbortError') {
          console.log('Trying to recover from device in use error...');
          // Wait a bit and try with just audio if video fails
          setTimeout(async () => {
            try {
              const audioOnlyStream = await navigator.mediaDevices.getUserMedia({ 
                video: false,
                audio: true
              });
              console.log('Recovered with audio-only stream');
              setLocalStream(audioOnlyStream);
              alert('Camera is in use. Connected with audio only. Please close other applications using your camera and refresh to enable video.');
            } catch (retryError) {
              console.error('Retry failed:', retryError);
              alert('Could not access camera/microphone. Please ensure:\n1. No other apps are using your camera\n2. You have granted camera/microphone permissions\n3. Your devices are properly connected');
            }
          }, 1000);
        } else {
          alert(`Failed to access media devices: ${error.message}\nPlease check your camera/microphone permissions and connections.`);
        }
      }
    }

    setupMediaStream();
  }, [classId, user]);

  useEffect(() => {
    if (!localStream || !participants || participants.length === 0 || !socketRef.current || !user) return;

    console.log('Local stream ready, attempting to connect to participants...');
    
    // Connect to participants when stream becomes available
    participants.forEach(participant => {
      if (participant._id !== user._id && !peerConnections.current[participant._id]) {
        console.log(`${user.role} connecting to ${participant.name} (${participant._id}) - stream now available`);
        
        // Create peer connection
        const pc = createPeerConnection(participant._id, participant.role);
        peerConnections.current[participant._id] = pc;
        
        // If teacher, initiate offer. If student, wait a moment for teacher's offer first
        if (user.role === 'teacher') {
          pc.createOffer().then(offer => {
            return pc.setLocalDescription(offer);
          }).then(() => {
            socketRef.current.emit('webrtc-offer', {
              to: participant._id,
              offer: pc.localDescription,
              from: user._id,
              role: user.role,
            });
          }).catch(err => {
            console.error(`Error creating teacher offer for ${participant._id}:`, err);
          });
        } else if (user.role === 'student') {
          // Students wait 2 seconds for teacher offer, then initiate if no offer received
          setTimeout(() => {
            if (pc.connectionState === 'new') {
              console.log(`Student initiating connection to teacher ${participant._id}`);
              pc.createOffer().then(offer => {
                return pc.setLocalDescription(offer);
              }).then(() => {
                socketRef.current.emit('webrtc-offer', {
                  to: participant._id,
                  offer: pc.localDescription,
                  from: user._id,
                  role: user.role,
                });
              }).catch(err => {
                console.error(`Error creating student offer for ${participant._id}:`, err);
              });
            }
          }, 2000);
        }
      }
    });
  }, [localStream, participants, user]);

  useEffect(() => {
    if (!classId || !user || !localStream || !socketRef.current) return;
    
    console.log('Setting up WebRTC signaling listeners...');
    const socket = socketRef.current;
    
    const handleOffer = async ({ offer, from, role }) => {
      console.log('Received offer from:', role, from);
      if (from === user._id) return;
      
      try {
        // Create or get existing peer connection
        let pc = peerConnections.current[from];
        if (!pc) {
          pc = createPeerConnection(from, role);
          peerConnections.current[from] = pc;
        }
        
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        
        socket.emit('webrtc-answer', { 
          to: from,
          answer, 
          from: user._id,
          role: user.role 
        });
      } catch (err) {
        console.error('WebRTC offer handling error:', err);
      }
    };

    const handleAnswer = async ({ answer, from }) => {
      console.log('Received answer from:', from);
      if (from === user._id) return;
      const pc = peerConnections.current[from];
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      }
    };

    const handleIceCandidate = async ({ candidate, from }) => {
      if (from === user._id) return;
      const pc = peerConnections.current[from];
      if (pc && candidate) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.error('Error adding ICE candidate:', e);
        }
      }
    };

    socket.on('webrtc-offer', handleOffer);
    socket.on('webrtc-answer', handleAnswer);
    socket.on('webrtc-ice-candidate', handleIceCandidate);

    return () => {
      socket.off('webrtc-offer', handleOffer);
      socket.off('webrtc-answer', handleAnswer);
      socket.off('webrtc-ice-candidate', handleIceCandidate);
    };
  }, [classId, user, localStream]);

  const toggleVideo = () => {
    if (!localStream) return;
    
    const videoTrack = localStream.getVideoTracks()[0];
    if (videoTrack) {
      const newState = !videoEnabled;
      videoTrack.enabled = newState;
      setVideoEnabled(newState);
      
      // Update local video state
      setVideoStates(prev => ({
        ...prev,
        [user._id]: newState
      }));
      
      // Notify other participants
      socketRef.current.emit('meeting-video-toggle', {
        meetingId: classId,
        userId: user._id,
        videoEnabled: newState
      });
      
      // Update video track ref
      videoTrackRef.current = videoTrack;
    }
  };

  function createPeerConnection(peerId, peerRole = null) {
    console.log('Creating peer connection for:', peerId, 'Role:', peerRole);
    
    const pc = new RTCPeerConnection({ 
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' }
      ],
      iceCandidatePoolSize: 10
    });

    // Add local tracks to connection only if localStream exists
    if (localStream) {
      localStream.getTracks().forEach(track => {
        console.log('Adding track to peer connection:', track.kind);
        pc.addTrack(track, localStream);
      });
    } else {
      console.log('No local stream available, skipping track addition');
    }

    // Handle connection state changes for debugging
    pc.onconnectionstatechange = () => {
      console.log(`Connection state with ${peerId}: ${pc.connectionState}`);
    };

    pc.oniceconnectionstatechange = () => {
      console.log(`ICE connection state with ${peerId}: ${pc.iceConnectionState}`);
    };

    pc.onsignalingstatechange = () => {
      console.log(`Signaling state with ${peerId}: ${pc.signalingState}`);
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('New ICE candidate');
        socketRef.current.emit('webrtc-ice-candidate', { 
          to: peerId,
          candidate: event.candidate, 
          from: user._id,
          role: user.role
        });
      }
    };

    // Handle connection state changes
    pc.onconnectionstatechange = (event) => {
      console.log('Connection state:', pc.connectionState);
    };

    // Handle ICE connection state
    pc.oniceconnectionstatechange = (event) => {
      console.log('ICE connection state:', pc.iceConnectionState);
    };

    // Handle incoming tracks - CRITICAL FIX
    pc.ontrack = (event) => {
      console.log('Received remote track:', event.track.kind, 'from peer:', peerId);
      const stream = event.streams[0];
      
      if (!stream) {
        console.error('No stream received with track');
        return;
      }
      
      console.log('Stream ID:', stream.id);
      console.log('Track:', event.track.kind, event.track.id);
      console.log(`Stream has ${stream.getVideoTracks().length} video tracks and ${stream.getAudioTracks().length} audio tracks`);
      console.log('Adding peer to state:', peerId, 'with role:', peerRole);
      
      // Ensure the stream has active tracks
      if (stream.getTracks().length === 0) {
        console.warn('Received stream with no tracks from peer:', peerId);
        return;
      }
      
      if (stream.getVideoTracks().length === 0) {
        console.warn(`No video tracks in stream from ${peerId}`);
      }
      
      setPeers(prevPeers => ({
        ...prevPeers,
        [peerId]: { 
          stream: stream,
          role: peerRole,
          pc: pc
        }
      }));
    };

    return pc;
  }

  // Get initials for avatar display
  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Get color based on name for consistent avatar colors
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

  // Get participant info by userId
  const getParticipantInfo = (userId) => {
    return participants.find(p => p._id === userId) || { name: 'Unknown', role: 'student' };
  };

  // Calculate grid layout based on number of participants - GOOGLE MEET STYLE
  const getGridLayout = (participantCount) => {
    if (participantCount <= 1) return 'grid-cols-1';
    if (participantCount === 2) return 'grid-cols-2';
    if (participantCount <= 4) return 'grid-cols-2';
    if (participantCount <= 6) return 'grid-cols-3';
    if (participantCount <= 9) return 'grid-cols-3';
    return 'grid-cols-4';
  };

  // Get teacher-first participant order (like Google Meet)
  const getOrderedParticipants = () => {
    const allParticipants = getAllVideoParticipants();
    
    // Sort: teacher first, then others
    return allParticipants.sort((a, b) => {
      if (a.role === 'teacher' && b.role !== 'teacher') return -1;
      if (a.role !== 'teacher' && b.role === 'teacher') return 1;
      return 0;
    });
  };

  // Get participants for student view - prioritize teacher
  const getStudentViewParticipants = () => {
    const allParticipants = getAllVideoParticipants();
    const teacher = allParticipants.find(p => p.role === 'teacher');
    const others = allParticipants.filter(p => p.role !== 'teacher');
    
    // Return teacher first, then others (limit others to 3 for better focus)
    return teacher ? [teacher, ...others.slice(0, 3)] : others.slice(0, 4);
  };

  // Always show all participants in the meeting (avatars/videos), fallback to local user if participants is empty
  const getAllVideoParticipants = () => {
    if (participants && participants.length > 0) {
      return participants.map(participant => {
        // For the local user, always use the localStream if available
        const isLocal = user && participant._id === user._id;
        return {
          userId: participant._id,
          stream: isLocal ? localStream : (peers[participant._id]?.stream || null),
          isLocal,
          name: participant.name,
          role: participant.role
        };
      });
    } else if (user) {
      // Fallback: show at least the local user
      return [{
        userId: user._id,
        stream: localStream,
        isLocal: true,
        name: user.name,
        role: user.role
      }];
    }
    return [];
  };

  return (
    <div className="w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      
      {/* Video Grid - Modern Enhanced Style */}
      <div
        className={`w-full h-full grid ${getGridLayout(getAllVideoParticipants().length)} auto-rows-fr gap-3 p-4`}
        style={{ minHeight: '400px' }}
      >
        {getOrderedParticipants().map((participant, idx) => {
          const isVideoOn = videoStates[participant.userId] !== false;
          const isTeacher = participant.role === 'teacher';
          const isLocalUser = participant.userId === user._id;

          return (
            <div
              key={`${participant.userId}-${participant.stream?.id || 'no-stream'}`}
              className={`relative flex flex-col items-stretch bg-slate-800/90 backdrop-blur-sm rounded-xl overflow-hidden shadow-2xl transition-all duration-300 hover:shadow-blue-500/20 hover:scale-[1.02] border
                ${isTeacher ? 'border-blue-500/60 ring-2 ring-blue-400/30 shadow-blue-500/30' : 'border-slate-600/40'}
                ${isTeacher && idx === 0 ? 'order-first' : ''}
              `}
              style={{ minHeight: '220px', minWidth: '220px' }}
            >
              {/* Video Stream or Avatar */}
              {(participant.stream && isVideoOn) ? (
                <video
                  autoPlay
                  playsInline
                  muted={isLocalUser}
                  ref={video => {
                    if (video && participant.stream) {
                      if (video.srcObject !== participant.stream) {
                        video.srcObject = participant.stream;
                        console.log(`Attached stream to video for ${participant.name}:`, participant.stream.id);
                      }
                    }
                  }}
                  onLoadedMetadata={() => console.log(`Video metadata loaded for ${participant.name}`)}
                  className="w-full h-full object-cover"
                  style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900">
                  <div className={`w-28 h-28 text-4xl rounded-full ${getAvatarColor(participant.name)} flex items-center justify-center text-white font-bold shadow-2xl border-4 border-white/20 backdrop-blur-sm`}>
                    {getInitials(participant.name)}
                  </div>
                  {!participant.stream && (
                    <div className="absolute top-3 left-3 bg-amber-500/90 backdrop-blur-sm text-white text-xs font-medium px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                      Connecting...
                    </div>
                  )}
                  {!isVideoOn && participant.stream && (
                    <div className="absolute top-3 left-3 bg-red-500/90 backdrop-blur-sm text-white text-xs font-medium px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                      </svg>
                      Video Off
                    </div>
                  )}
                </div>
              )}

              {/* Participant Info Bar - Enhanced */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-3 flex items-center justify-between backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <span className="text-white text-sm font-semibold drop-shadow-lg tracking-wide">
                    {participant.name}
                  </span>
                  {isTeacher && (
                    <span className="bg-gradient-to-r from-blue-600 to-blue-500 text-white text-xs font-medium px-2.5 py-1 rounded-full shadow-lg">
                      Teacher
                    </span>
                  )}
                  {isLocalUser && (
                    <span className="bg-gradient-to-r from-slate-600 to-slate-500 text-white text-xs font-medium px-2.5 py-1 rounded-full shadow-lg">
                      You
                    </span>
                  )}
                </div>
                {/* Video Status Indicator */}
                <div className="flex items-center gap-1.5">
                  {!isVideoOn && (
                    <div className="p-1.5 bg-red-500/80 backdrop-blur-sm rounded-full">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                        <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ClassroomVideo;