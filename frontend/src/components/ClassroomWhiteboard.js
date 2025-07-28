import React, { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import io from 'socket.io-client';
import { fabric } from 'fabric';

const SOCKET_URL = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';

const ClassroomWhiteboard = ({ classId }) => {
  const { user } = useSelector((state) => state.auth);
  const canvasRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!classId || !user) return;
    // Init Fabric.js
    const canvas = new fabric.Canvas(canvasRef.current, {
      isDrawingMode: true,
      backgroundColor: '#fff',
      width: 800,
      height: 400,
    });
    // Save to ref for cleanup
    canvasRef.current.fabric = canvas;
    // Drawing event
    canvas.on('path:created', (e) => {
      const path = e.path;
      if (socketRef.current) {
        socketRef.current.emit('whiteboard-draw', {
          classId,
          data: path.toObject(['path', 'stroke', 'strokeWidth', 'fill', 'version']),
        });
      }
    });
    return () => {
      canvas.dispose();
    };
  }, [classId, user]);

  useEffect(() => {
    if (!classId || !user) return;
    socketRef.current = io(SOCKET_URL, { transports: ['websocket'] });
    socketRef.current.emit('joinClass', { classId, userId: user._id });
    // Listen for draw events
    socketRef.current.on('whiteboard-draw', (data) => {
      const canvas = canvasRef.current.fabric;
      if (canvas) {
        fabric.util.enlivenObjects([data], ([obj]) => {
          canvas.add(obj);
        });
      }
    });
    // Listen for clear events
    socketRef.current.on('whiteboard-clear', () => {
      const canvas = canvasRef.current.fabric;
      if (canvas) canvas.clear();
    });
    return () => {
      socketRef.current.disconnect();
    };
  }, [classId, user]);

  const handleClear = () => {
    const canvas = canvasRef.current.fabric;
    if (canvas) canvas.clear();
    if (socketRef.current) {
      socketRef.current.emit('whiteboard-clear', { classId });
    }
  };

  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl font-semibold">Whiteboard</h2>
        <button className="bg-red-500 text-white px-3 py-1 rounded" onClick={handleClear}>Clear</button>
      </div>
      <canvas ref={canvasRef} width={800} height={400} className="border rounded shadow" />
    </div>
  );
};

export default ClassroomWhiteboard; 