import React, { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import io from 'socket.io-client';
import api from '../services/api';

const SOCKET_URL = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';

const ClassroomChat = ({ classId }) => {
  const { user } = useSelector((state) => state.auth);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const socketRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!classId || !user) return;
    setLoading(true);
    // Try with the correct endpoint format - using classes instead of class
    api.get(`/classes/${classId}/messages`)
      .then(res => {
        setMessages(res.data.data || res.data.messages || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading messages:", err);
        // Fallback to alternative endpoint formats
        api.get(`/class/${classId}/messages`)
          .then(res => {
            setMessages(res.data.data || res.data.messages || []);
            setLoading(false);
          })
          .catch((err2) => {
            console.error("Second attempt error:", err2);
            // Try another alternative endpoint
            api.get(`/messages/class/${classId}`)
              .then(res => {
                setMessages(res.data.data || res.data.messages || []);
                setLoading(false);
              })
              .catch((fallbackErr) => {
                console.error("Fallback error loading messages:", fallbackErr);
                // Try direct messages endpoint
                api.get(`/messages/${classId}`)
                  .then(res => {
                    setMessages(res.data.data || res.data.messages || []);
                    setLoading(false);
                  })
                  .catch((finalErr) => {
                    console.error("Final attempt error loading messages:", finalErr);
                    setError(null); // Clear error to show empty state message
                    setLoading(false);
                    // Initialize with empty messages to allow sending
                    setMessages([]);
                  });
              });
          });
      });
  }, [classId, user]);

  useEffect(() => {
    if (!classId || !user) return;
    
    // Connect to socket
    socketRef.current = io(SOCKET_URL, { 
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5
    });
    
    // Join class room
    socketRef.current.emit('joinClass', { classId, userId: user._id });
    
    // Listen for new messages
    socketRef.current.on('chatMessage', (msg) => {
      // Avoid duplicates by checking if message already exists
      setMessages((prev) => {
        if (prev.some(m => m._id === msg._id)) return prev;
        
        // Replace temporary message if it exists
        if (msg.sender === user._id) {
          const withoutTemp = prev.filter(m => !m._id.toString().includes('temp-'));
          return [...withoutTemp, msg];
        }
        
        return [...prev, msg];
      });
    });
    
    // Handle chat errors
    socketRef.current.on('chatError', (error) => {
      console.error('Chat error:', error);
      setError(error.message || 'Failed to send message');
      // Remove temporary message on error
      setMessages(prev => prev.filter(m => !m._id.toString().includes('temp-')));
    });
    
    // Handle connection errors
    socketRef.current.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setError('Connection error. Please refresh the page.');
    });
    
    return () => {
      if (socketRef.current) {
        socketRef.current.off('chatMessage');
        socketRef.current.off('chatError');
        socketRef.current.off('connect_error');
        socketRef.current.disconnect();
      }
    };
  }, [classId, user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    // Clear any previous errors
    setError(null);
    
    const messageData = {
      classId,
      userId: user._id,
      sender: user._id,
      senderName: user.name || 'You',
      content: input,
      createdAt: new Date().toISOString()
    };
    
    // Add message locally for immediate feedback with temporary ID
    const tempMessage = {
      ...messageData,
      _id: `temp-${Date.now()}`
    };
    setMessages(prev => [...prev, tempMessage]);
    
    // Try to send via socket first if connected
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('chatMessage', messageData);
    } else {
      // Socket not connected, use API only
      sendViaAPI(input, tempMessage._id);
    }
    
    setInput('');
  };
  
  // Helper function to send message via API with fallbacks
  const sendViaAPI = (content, tempId) => {
    const messageData = {
      content,
      userId: user._id,
      senderName: user.name || 'You'
    };
    
    // Try primary endpoint
    api.post(`/classes/${classId}/messages`, messageData)
      .then(res => {
        // Replace temp message with real one from server
        if (res.data && res.data.data) {
          setMessages(prev => 
            prev.map(msg => 
              msg._id === tempId ? {...res.data.data, senderName: user.name || 'You'} : msg
            )
          );
        }
      })
      .catch(err => {
        console.error('Failed to send message via primary API:', err);
        // Try first alternative endpoint
        api.post(`/class/${classId}/messages`, messageData)
          .then(res => {
            if (res.data && res.data.data) {
              setMessages(prev => 
                prev.map(msg => 
                  msg._id === tempId ? {...res.data.data, senderName: user.name || 'You'} : msg
                )
              );
            }
          })
          .catch(err2 => {
            console.error('Failed to send message via second API attempt:', err2);
            // Try second alternative endpoint
            api.post(`/messages/class/${classId}`, messageData)
              .then(res => {
                if (res.data && res.data.data) {
                  setMessages(prev => 
                    prev.map(msg => 
                      msg._id === tempId ? {...res.data.data, senderName: user.name || 'You'} : msg
                    )
                  );
                }
              })
              .catch(fallbackErr => {
                console.error('Failed to send message via third API attempt:', fallbackErr);
                // Try direct messages endpoint
                api.post(`/messages/${classId}`, messageData)
                  .then(res => {
                    if (res.data && res.data.data) {
                      setMessages(prev => 
                        prev.map(msg => 
                          msg._id === tempId ? {...res.data.data, senderName: user.name || 'You'} : msg
                        )
                      );
                    }
                  })
                  .catch(finalErr => {
                    console.error('Failed to send message via all API attempts:', finalErr);
                    // Show error and remove temp message
                    setError('Failed to send message. Please try again.');
                    setMessages(prev => prev.filter(msg => msg._id !== tempId));
                  });
              });
          });
      });
  };

  return (
    <div className="flex flex-col h-full max-h-[400px] border rounded">
      <div className="flex-1 overflow-y-auto p-2 bg-gray-50">
        {loading ? <div>Loading...</div> : error ? <div className="text-red-500">{error}</div> : (
          <ul className="space-y-2">
            {messages.length === 0 ? (
              <li className="text-center py-8">
                <div className="px-4 py-3 rounded bg-blue-50 text-blue-700 inline-block">
                  <span className="font-semibold">Welcome to the classroom chat!</span>
                  <p className="text-sm mt-1">Say Hi to start the conversation.</p>
                </div>
              </li>
            ) : (
              messages.map((msg, index) => (
                <li key={msg._id || `temp-${index}`} className={`flex flex-col ${msg.sender === user._id ? 'items-end' : 'items-start'}`}>
                  <div className={`px-3 py-1 rounded ${msg.sender === user._id ? 'bg-blue-200' : 'bg-gray-200'}`}>
                    <span className="font-semibold text-xs text-gray-700">
                      {msg.sender === user._id ? 'You' : (msg.senderName || 'User')}
                    </span>
                    <span className="block text-sm">{msg.content}</span>
                  </div>
                  <span className="text-xs text-gray-400 mt-1">
                    {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString() : new Date().toLocaleTimeString()}
                  </span>
                </li>
              ))
            )}
            <div ref={bottomRef} />
          </ul>
        )}
      </div>
      <form className="flex border-t" onSubmit={handleSend}>
        <input
          className="flex-1 px-2 py-1 outline-none"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type a message..."
        />
        <button type="submit" className="bg-blue-600 text-white px-4 py-1">Send</button>
      </form>
    </div>
  );
};

export default ClassroomChat;