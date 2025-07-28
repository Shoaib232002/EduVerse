import React, { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import io from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';

const ClassroomVideo = ({ classId }) => {
  const { user } = useSelector((state) => state.auth);
  const [peers, setPeers] = useState({}); // { userId: { stream, ref } }
  const [localStream, setLocalStream] = useState(null);
  const socketRef = useRef();
  const peerConnections = useRef({});

  useEffect(() => {
    if (!classId || !user) return;
    socketRef.current = io(SOCKET_URL, { transports: ['websocket'] });
    socketRef.current.emit('joinClass', { classId, userId: user._id });
    return () => {
      socketRef.current.disconnect();
      Object.values(peerConnections.current).forEach(pc => pc.close());
    };
  }, [classId, user]);

  useEffect(() => {
    if (!classId || !user) return;
    // Get local media
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        setLocalStream(stream);
        // Notify others
        socketRef.current.emit('webrtc-offer', { classId, offer: null, from: user._id });
      });
  }, [classId, user]);

  useEffect(() => {
    if (!classId || !user || !localStream) return;
    // Handle signaling
    const socket = socketRef.current;
    // When another user sends an offer
    socket.on('webrtc-offer', async ({ offer, from }) => {
      if (from === user._id) return;
      const pc = createPeerConnection(from);
      peerConnections.current[from] = pc;
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit('webrtc-answer', { classId, answer, from: user._id });
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

  function createPeerConnection(peerId) {
    const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
    localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current.emit('webrtc-ice-candidate', { classId, candidate: event.candidate, from: user._id });
      }
    };
    pc.ontrack = (event) => {
      setPeers(prev => ({ ...prev, [peerId]: { stream: event.streams[0] } }));
    };
    return pc;
  }

  return (
    <div className="mb-4">
      <h2 className="text-xl font-semibold mb-2">Video Conference</h2>
      <div className="flex flex-wrap gap-4">
        <div>
          <div className="text-xs text-gray-500">You</div>
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
        {Object.entries(peers).map(([peerId, { stream }]) => (
          <div key={peerId}>
            <div className="text-xs text-gray-500">{peerId}</div>
            <video
              autoPlay
              playsInline
              ref={video => {
                if (video && stream) video.srcObject = stream;
              }}
              className="w-48 h-36 bg-black rounded"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ClassroomVideo; 