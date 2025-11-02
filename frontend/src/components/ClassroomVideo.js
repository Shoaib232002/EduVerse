import React, { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import io from 'socket.io-client';

const SOCKET_URL = (process.env.REACT_APP_API_URL || 'http://localhost:5000').replace(/\/api\/?$/, '');
console.log('Connecting to socket URL:', SOCKET_URL);

const ClassroomVideo = ({ classId, largeGrid, videoEnabled = true }) => {
  const { user } = useSelector((state) => state.auth);
  const [peers, setPeers] = useState({}); // { userId: { stream, ref, role } }
  const [localStream, setLocalStream] = useState(null);
  const socketRef = useRef();
  const peerConnections = useRef({});
  const [teacherStream, setTeacherStream] = useState(null);
  const videoTrackRef = useRef(null);

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

    // Function to handle media access
    async function setupMediaStream() {
      try {
        // First try to get existing active devices
        const devices = await navigator.mediaDevices.enumerateDevices();
        console.log('Available devices:', devices);
        
        const isLocalTesting = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        let stream;
        
        try {
          // Try to get media with specific constraints
          stream = await navigator.mediaDevices.getUserMedia({ 
            video: videoEnabled ? {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              frameRate: { ideal: 30 }
            } : false,
            audio: {
              echoCancellation: true,
              noiseSuppression: true
            }
          });
          console.log('Got real media stream');
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
        
        // For teacher, immediately notify others
        if (user.role === 'teacher') {
          console.log('Teacher notifying students');
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
    if (!classId || !user || !localStream) return;
    
    console.log('Setting up WebRTC signaling...');
    // Handle signaling
    const socket = socketRef.current;
    
    // When another user sends an offer
    socket.on('webrtc-offer', async ({ offer, from, role }) => {
      console.log('Received offer from:', role);
      if (from === user._id) return;
      
      try {
        const pc = createPeerConnection(from);
        peerConnections.current[from] = pc;
        
        if (offer) {
          console.log('Setting remote description from offer');
          await pc.setRemoteDescription(new RTCSessionDescription(offer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit('webrtc-answer', { 
            classId, 
            answer, 
            from: user._id,
            role: user.role 
          });
        } else if (user.role === 'student' && role === 'teacher') {
          console.log('Creating offer for teacher');
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit('webrtc-offer', { 
            classId, 
            offer, 
            from: user._id,
            role: 'student'
          });
        }
      } catch (err) {
        console.error('WebRTC offer handling error:', err);
      }
    });
    // When another user sends an answer
    socket.on('webrtc-answer', async ({ answer, from }) => {
      if (from === user._id) return;
      const pc = peerConnections.current[from];
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      }
    });
    // ICE candidates
    socket.on('webrtc-ice-candidate', async ({ candidate, from }) => {
      if (from === user._id) return;
      const pc = peerConnections.current[from];
      if (pc && candidate) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {}
      }
    });
    // When a new user joins, create an offer
    socket.on('user-joined', async ({ userId }) => {
      if (userId === user._id) return;
      const pc = createPeerConnection(userId);
      peerConnections.current[userId] = pc;
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit('webrtc-offer', { classId, offer, from: user._id });
    });
    // Clean up on disconnect
    return () => {
      socket.off('webrtc-offer');
      socket.off('webrtc-answer');
      socket.off('webrtc-ice-candidate');
      socket.off('user-joined');
    };
    // eslint-disable-next-line
  }, [classId, user, localStream]);

  const toggleVideo = () => {
    if (!localStream) return;
    
    const videoTrack = localStream.getVideoTracks()[0];
    if (videoTrack) {
      const newState = !videoEnabled;
      videoTrack.enabled = newState;
      setVideoEnabled(newState);
      
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

  function createPeerConnection(peerId) {
    console.log('Creating peer connection for:', peerId);
    
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

    // Add local tracks to connection
    localStream.getTracks().forEach(track => {
      console.log('Adding track to peer connection:', track.kind);
      pc.addTrack(track, localStream);
    });

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('New ICE candidate');
        socketRef.current.emit('webrtc-ice-candidate', { 
          classId, 
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

    // Handle incoming tracks
    pc.ontrack = (event) => {
      console.log('Received remote track:', event.track.kind, 'from peer:', peerId);
      const stream = event.streams[0];
      
      // Ensure we have a valid stream
      if (!stream) {
        console.error('No stream received with track');
        return;
      }
      
      console.log('Stream ID:', stream.id);
      console.log('Track:', event.track.kind, event.track.id);
      
      setPeers(prev => ({ ...prev, [peerId]: { stream } }));
      
      // If this is student, check if the stream is from teacher
      if (user.role === 'student') {
        console.log('Student checking if stream is from teacher');
        
        // Clean up previous listener
        socketRef.current.off('peer-role');
        
        // Set up new listener
        socketRef.current.on('peer-role', ({ id, role }) => {
          console.log('Received peer role:', id, role);
          if (id === peerId && role === 'teacher') {
            console.log('Confirmed teacher stream, setting...');
            setTeacherStream(stream);
          }
        });
        
        // Request peer role
        socketRef.current.emit('get-peer-role', { peerId });
      }
    };

    return pc;
  }

  return (
    <div className="mb-4 w-full h-full flex flex-wrap gap-6 items-center justify-center relative">
      {/* Video Controls */}
      {/* <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-20 flex gap-4 bg-gray-800 p-3 rounded-lg">
        <button
          onClick={toggleVideo}
          className={`p-2 rounded-full ${
            videoEnabled ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'
          }`}
          title={videoEnabled ? 'Turn off video' : 'Turn on video'}
        >
          {videoEnabled ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2zM3 3l18 18" />
            </svg>
          )}
        </button>
      </div> */}
      {user.role === 'student' ? (
        // For students
        <div className="flex flex-col items-center">
          <div className="text-sm font-medium text-gray-700 mb-2">
            {teacherStream ? 'Teacher' : 'Connecting to teacher...'}
          </div>
          {teacherStream ? (
            <video
              autoPlay
              playsInline
              ref={video => {
                if (video && teacherStream) {
                  console.log('Setting teacher stream to video element');
                  video.srcObject = teacherStream;
                }
              }}
              className="w-[640px] h-[480px] bg-black rounded-2xl shadow-lg"
            />
          ) : (
            <div className="w-[640px] h-[480px] bg-black rounded-2xl shadow-lg flex items-center justify-center text-white">
              Waiting for teacher's video...
            </div>
          )}
          
          {/* Show student's own video in smaller size */}
          <div className="absolute top-4 right-4">
            <div className="text-sm font-medium text-gray-700 mb-2">You</div>
            <video
              autoPlay
              muted
              playsInline
              ref={video => {
                if (video && localStream) video.srcObject = localStream;
              }}
              className="w-48 h-36 bg-black rounded"
            />
          </div>
        </div>
      ) : (
        // For teacher
        <div className="flex flex-col items-center">
          <div className="text-sm font-medium text-gray-700 mb-2">You (Teacher)</div>
          <video
            autoPlay
            muted
            playsInline
            ref={video => {
              if (video && localStream) {
                console.log('Setting teacher local stream to video element');
                video.srcObject = localStream;
              }
            }}
            className="w-[640px] h-[480px] bg-black rounded-2xl shadow-lg"
          />
        </div>
      )}
      {/* Show other participants in smaller windows */}
      {Object.entries(peers).map(([peerId, { stream }]) => (
        (user.role === 'student' && teacherStream && stream === teacherStream) ? null : (
          <div key={peerId} className="flex flex-col items-center">
            <div className="text-sm font-medium text-gray-700 mb-2">Participant</div>
            <video
              autoPlay
              playsInline
              ref={video => {
                if (video && stream) video.srcObject = stream;
              }}
              className="w-[160px] h-[120px] bg-black rounded-xl shadow-lg"
            />
          </div>
        )
      ))}
    </div>
  );
};

export default ClassroomVideo; 