import React, { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import io from 'socket.io-client';
import { fabric } from 'fabric';
import { FaSquare, FaCircle, FaPlay, FaStar, FaHeart, FaDrawPolygon, FaFont, FaMinus } from 'react-icons/fa';

const SOCKET_URL = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';

const ClassroomWhiteboard = ({ classId, viewOnly, width = 800, height = 400 }) => {
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
      isDrawingMode: !viewOnly,
      backgroundColor: '#fff',
      width,
      height,
    });
    // Save to ref for cleanup
    canvasRef.current.fabric = canvas;

    // Add safety checks to fix various errors in fabric.js
    // Fix for "Cannot read properties of undefined (reading 'group')" error
    const originalSearchPossibleTargets = fabric.Canvas.prototype._searchPossibleTargets;
    fabric.Canvas.prototype._searchPossibleTargets = function(e) {
      if (!e || !e.target) return [];
      return originalSearchPossibleTargets.call(this, e);
    };
    
    // Fix for "target.fire is not a function" error
    const originalHandleEvent = fabric.Canvas.prototype._handleEvent;
    fabric.Canvas.prototype._handleEvent = function(e, eventType) {
      if (!e || !e.target || typeof e.target.fire !== 'function') {
        return false;
      }
      return originalHandleEvent.call(this, e, eventType);
    };
    
    // Additional fix for fireSyntheticInOutEvents
    const originalFireSyntheticInOutEvents = fabric.Canvas.prototype.fireSyntheticInOutEvents;
    fabric.Canvas.prototype.fireSyntheticInOutEvents = function(target, e, prevTarget) {
      if (!target || typeof target.fire !== 'function') {
        return;
      }
      
     const oldTarget = this._hoveredTarget;
      
      if (oldTarget && oldTarget !== target && typeof oldTarget.fire === 'function') {
        try {
          oldTarget.fire('mouseout', {
            e: e,
            target: oldTarget,
            nextTarget: target,
          });
        } catch (err) {
          console.warn('Error in mouseout event:', err);
        }
      }
      
      if (target && target !== oldTarget) {
        try {
          target.fire('mouseover', {
            e: e,
            target: target,
            previousTarget: oldTarget,
          });
        } catch (err) {
          console.warn('Error in mouseover event:', err);
        }
      }
    };
    
    // Fix for _onMouseOut error
    const original_onMouseOut = fabric.Canvas.prototype._onMouseOut;
    fabric.Canvas.prototype._onMouseOut = function(e) {
      const target = this._hoveredTarget;
      this._hoveredTarget = null;
      if (target && typeof target.fire === 'function') {
        try {
          target.fire('mouseout', {
            e: e,
            target: target,
          });
        } catch (err) {
          console.warn('Error in _onMouseOut:', err);
        }
      }
    };
    
    // Fix for "Cannot read properties of undefined (reading '_set')" error
    const originalAdd = fabric.Canvas.prototype.add;
    fabric.Canvas.prototype.add = function(...objects) {
      const validObjects = objects.filter(obj => obj && typeof obj === 'object');
      if (validObjects.length === 0) return this;
      return originalAdd.call(this, ...validObjects);
    };
    
    // Fix for "Cannot read properties of undefined (reading 'onSelect')" error
    const originalSetActiveObject = fabric.Canvas.prototype.setActiveObject;
    fabric.Canvas.prototype.setActiveObject = function(object, e) {
      if (!object) return false;
      try {
        return originalSetActiveObject.call(this, object, e);
      } catch (err) {
        console.warn('Error in setActiveObject:', err);
        return false;
      }
    };
    
    // Fix for "_setActiveObject" error
    const original_setActiveObject = fabric.Canvas.prototype._setActiveObject;
    fabric.Canvas.prototype._setActiveObject = function(object, e) {
      if (!object) return false;
      try {
        if (this._activeObject && !this._activeObject.onSelect) {
          this._activeObject.onSelect = function() {};
        }
        return original_setActiveObject.call(this, object, e);
      } catch (err) {
        console.warn('Error in _setActiveObject:', err);
        return false;
      }
    };
    
    // Fix for "target._findTargetCorner is not a function" error
    const originalSetCursorFromEvent = fabric.Canvas.prototype._setCursorFromEvent;
    fabric.Canvas.prototype._setCursorFromEvent = function(e) {
      if (!e || !e.target || typeof e.target._findTargetCorner !== 'function') {
        this.setCursor(this.defaultCursor);
        return;
      }
      return originalSetCursorFromEvent.call(this, e);
    };
    
    // Fix for __onMouseDown error with _findTargetCorner
    const original__onMouseDown = fabric.Canvas.prototype.__onMouseDown;
    fabric.Canvas.prototype.__onMouseDown = function(e) {
      if (!e || !e.target || typeof e.target._findTargetCorner !== 'function') {
        return original__onMouseDown.call(this, e);
      }
      try {
        return original__onMouseDown.call(this, e);
      } catch (err) {
        console.warn('Error in __onMouseDown:', err);
        return false;
      }
    };

    // Set initial brush settings
    canvas.freeDrawingBrush.color = currentColor;
    canvas.freeDrawingBrush.width = brushSize;
    
    // Enable object selection by default
    canvas.selection = true;

    if (!viewOnly) {
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
    }

    return () => {
      canvas.dispose();
    };
  }, [classId, user, viewOnly]);

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
    if (viewOnly) return;
    const canvas = canvasRef.current.fabric;
    if (canvas) canvas.clear();
    if (socketRef.current) {
      socketRef.current.emit('whiteboard-clear', { classId });
    }
  };

  const addShape = (shapeType) => {
    if (viewOnly) return;
    const canvas = canvasRef.current.fabric;
    if (!canvas) return;
    
    let shape;
    switch (shapeType) {
      case 'rectangle':
        shape = new fabric.Rect({
          left: 100,
          top: 100,
          width: 100,
          height: 80,
          fill: currentColor,
        });
        break;
      case 'circle':
        shape = new fabric.Circle({
          left: 100,
          top: 100,
          radius: 50,
          fill: currentColor,
        });
        break;
      case 'triangle':
        shape = new fabric.Triangle({
          left: 100,
          top: 100,
          width: 100,
          height: 80,
          fill: currentColor,
        });
        break;
      case 'star':
        // Create a star shape using polygon
        const points = [
          {x: 0, y: -50},
          {x: 19.1, y: -15.5},
          {x: 58.8, y: -15.5},
          {x: 23.6, y: 5.9},
          {x: 38.2, y: 40.5},
          {x: 0, y: 19.1},
          {x: -38.2, y: 40.5},
          {x: -23.6, y: 5.9},
          {x: -58.8, y: -15.5},
          {x: -19.1, y: -15.5}
        ];
        shape = new fabric.Polygon(points, {
          left: 100,
          top: 100,
          fill: currentColor,
        });
        break;
      case 'heart':
        // Create a heart shape using path
        shape = new fabric.Path('M 0 -28 C -28 -28 -28 0 0 28 C 28 0 28 -28 0 -28 z', {
          left: 100,
          top: 100,
          fill: currentColor,
          scaleX: 1.5,
          scaleY: 1.5
        });
        break;
      case 'line':
        shape = new fabric.Line([50, 50, 150, 50], {
          left: 100,
          top: 100,
          stroke: currentColor,
          strokeWidth: 5
        });
        break;
      case 'pentagon':
        // Create a pentagon shape using polygon
        const pentagonPoints = [
          {x: 0, y: -50},
          {x: 47.5, y: -15.5},
          {x: 29.4, y: 40.5},
          {x: -29.4, y: 40.5},
          {x: -47.5, y: -15.5}
        ];
        shape = new fabric.Polygon(pentagonPoints, {
          left: 100,
          top: 100,
          fill: currentColor,
        });
        break;
      default:
        return;
    }
    
    if (shape) {
      try {
        // Make shape selectable and interactive
        shape.selectable = true;
        shape.evented = true;
        
        canvas.add(shape);
        // Safely set active object
        try {
          canvas.setActiveObject(shape);
        } catch (err) {
          console.warn('Error setting active object:', err);
        }
      } catch (err) {
        console.error('Error adding shape:', err);
      }
    }
  };

  const addText = () => {
    if (viewOnly) return;
    const canvas = canvasRef.current.fabric;
    if (!canvas) return;
    
    try {
      const text = new fabric.IText('Type here', {
        left: 100,
        top: 100,
        fill: currentColor,
        fontSize: 20,
      });
      
      if (text) {
        // Make text selectable and editable
        text.selectable = true;
        text.editable = true;
        text.evented = true;
        
        canvas.add(text);
        // Safely set active object
        try {
          canvas.setActiveObject(text);
        } catch (err) {
          console.warn('Error setting active text object:', err);
        }
      }
    } catch (err) {
      console.error('Error adding text:', err);
    }
  };

  const setTool = (tool) => {
    if (viewOnly) return;
    const canvas = canvasRef.current.fabric;
    if (!canvas) return;
    
    setCurrentTool(tool);
    
    // Set drawing mode only for brush tool
    canvas.isDrawingMode = tool === 'brush';
    
    // For select tool, make objects selectable and disable drawing mode
    if (tool === 'select') {
      canvas.selection = true;
      canvas.forEachObject(obj => {
        obj.selectable = true;
        obj.evented = true;
      });
    }
  };

  return (
    <div className="mb-4">
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-semibold">Whiteboard</h2>
          {!viewOnly && (
            <button className="bg-red-500 text-white px-3 py-1 rounded" onClick={handleClear}>Clear</button>
          )}
        </div>
        {!viewOnly && (
          <>
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
          </>
        )}
      </div>
  <canvas ref={canvasRef} width={width} height={height} className="border rounded shadow" />
    </div>
  );
};

export default ClassroomWhiteboard;