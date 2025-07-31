import React, { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import io from 'socket.io-client';
import { fabric } from 'fabric';
import { FaSquare, FaCircle, FaPlay, FaStar, FaHeart, FaDrawPolygon, FaFont, FaMinus } from 'react-icons/fa';

const SOCKET_URL = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';

const ClassroomWhiteboard = ({ classId }) => {
  const { user } = useSelector((state) => state.auth);
  const canvasRef = useRef(null);
  const socketRef = useRef(null);
  const [currentColor, setCurrentColor] = useState('#000000');
  const [currentTool, setCurrentTool] = useState('brush');
  const [brushSize, setBrushSize] = useState(5);

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

    // Set initial brush settings
    canvas.freeDrawingBrush.color = currentColor;
    canvas.freeDrawingBrush.width = brushSize;

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

    // Object added event (for shapes and text)
    canvas.on('object:added', (e) => {
      if (!e.target._fromSocket && socketRef.current) {
        socketRef.current.emit('whiteboard-draw', {
          classId,
          data: e.target.toObject(),
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

  const addShape = (shapeType) => {
    const canvas = canvasRef.current.fabric;
    if (!canvas) return;

    let shape;
    switch (shapeType) {
      case 'rectangle':
        shape = new fabric.Rect({
          width: 100,
          height: 100,
          fill: currentColor,
          left: 100,
          top: 100,
        });
        break;
      case 'circle':
        shape = new fabric.Circle({
          radius: 50,
          fill: currentColor,
          left: 100,
          top: 100,
        });
        break;
      case 'triangle':
        shape = new fabric.Triangle({
          width: 100,
          height: 100,
          fill: currentColor,
          left: 100,
          top: 100,
        });
        break;
      case 'star':
        shape = new fabric.Path('M 50 0 L 61 35 L 98 35 L 68 57 L 79 91 L 50 70 L 21 91 L 32 57 L 2 35 L 39 35 Z', {
          fill: currentColor,
          left: 100,
          top: 100,
          scaleX: 0.5,
          scaleY: 0.5,
        });
        break;
      case 'heart':
        shape = new fabric.Path('M 50 100 C 100 25 0 25 50 100', {
          fill: currentColor,
          left: 100,
          top: 100,
          scaleX: 1.5,
          scaleY: 1.5,
        });
        break;
      case 'line':
        shape = new fabric.Line([50, 50, 200, 50], {
          stroke: currentColor,
          strokeWidth: 4,
          left: 100,
          top: 100,
        });
        break;
      case 'pentagon':
        shape = new fabric.Path('M 50 0 L 100 38 L 82 100 L 18 100 L 0 38 Z', {
          fill: currentColor,
          left: 100,
          top: 100,
          scaleX: 0.5,
          scaleY: 0.5,
        });
        break;
      default:
        return;
    }
    canvas.add(shape);
    canvas.setActiveObject(shape);
  };

  const addText = () => {
    const canvas = canvasRef.current.fabric;
    if (!canvas) return;

    const text = new fabric.IText('Type here', {
      left: 100,
      top: 100,
      fill: currentColor,
      fontSize: 20,
    });
    canvas.add(text);
    canvas.setActiveObject(text);
  };

  const setTool = (tool) => {
    const canvas = canvasRef.current.fabric;
    if (!canvas) return;

    setCurrentTool(tool);
    canvas.isDrawingMode = tool === 'brush';
  };

  return (
    <div className="mb-4">
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-semibold">Whiteboard</h2>
          <button className="bg-red-500 text-white px-3 py-1 rounded" onClick={handleClear}>Clear</button>
        </div>
        
        <div className="flex gap-2 mb-2">
          <button 
            className={`px-3 py-1 rounded ${currentTool === 'brush' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setTool('brush')}
          >
            Brush
          </button>
          <button 
            className={`px-3 py-1 rounded ${currentTool === 'select' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setTool('select')}
          >
            Select
          </button>
          <select 
            className="bg-gray-200 px-3 py-1 rounded flex items-center"
            onChange={(e) => e.target.value && addShape(e.target.value)}
            value=""
            style={{ minWidth: '150px' }}
          >
            <option value="">Add Shape</option>
            <option value="rectangle" className="flex items-center gap-2">
              <FaSquare className="inline-block mr-2" /> Rectangle
            </option>
            <option value="circle" className="flex items-center gap-2">
              <FaCircle className="inline-block mr-2" /> Circle
            </option>
            <option value="triangle" className="flex items-center gap-2">
              <FaPlay className="inline-block mr-2" /> Triangle
            </option>
            <option value="star" className="flex items-center gap-2">
              <FaStar className="inline-block mr-2" /> Star
            </option>
            <option value="heart" className="flex items-center gap-2">
              <FaHeart className="inline-block mr-2" /> Heart
            </option>
            <option value="line" className="flex items-center gap-2">
              <FaMinus className="inline-block mr-2" /> Line
            </option>
            <option value="pentagon" className="flex items-center gap-2">
              <FaDrawPolygon className="inline-block mr-2" /> Pentagon
            </option>
          </select>
          <button 
            className="bg-gray-200 px-3 py-1 rounded flex items-center gap-2"
            onClick={addText}
          >
            <FaFont className="inline-block" /> Text
          </button>
        </div>

        <div className="flex items-center gap-4 mb-2">
          <div className="flex items-center gap-2">
            <label>Color:</label>
            <input 
              type="color" 
              value={currentColor}
              onChange={(e) => {
                setCurrentColor(e.target.value);
                const canvas = canvasRef.current.fabric;
                if (canvas) {
                  canvas.freeDrawingBrush.color = e.target.value;
                }
              }}
            />
          </div>
          <div className="flex items-center gap-2">
            <label>Brush Size:</label>
            <input 
              type="range" 
              min="1" 
              max="50" 
              value={brushSize}
              onChange={(e) => {
                setBrushSize(Number(e.target.value));
                const canvas = canvasRef.current.fabric;
                if (canvas) {
                  canvas.freeDrawingBrush.width = Number(e.target.value);
                }
              }}
            />
          </div>
        </div>
      </div>
      <canvas ref={canvasRef} width={800} height={400} className="border rounded shadow" />
    </div>
  );
};

export default ClassroomWhiteboard; 