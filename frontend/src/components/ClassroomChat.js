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
    api.get(`/class/${classId}/messages`)
      .then(res => {
        setMessages(res.data.messages);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load messages');
        setLoading(false);
      });
  }, [classId, user]);

  useEffect(() => {
    if (!classId || !user) return;
    socketRef.current = io(SOCKET_URL, { transports: ['websocket'] });
    socketRef.current.emit('joinClass', { classId, userId: user._id });
    socketRef.current.on('chatMessage', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });
    return () => {
      socketRef.current.disconnect();
    };
  }, [classId, user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    socketRef.current.emit('chatMessage', {
      classId,
      userId: user._id,
      content: input,
    });
    setInput('');
  };

  return (
    <div className="flex flex-col h-full max-h-[400px] border rounded">
      <div className="flex-1 overflow-y-auto p-2 bg-gray-50">
        {loading ? <div>Loading...</div> : error ? <div className="text-red-500">{error}</div> : (
          <ul className="space-y-2">
            {messages.map(msg => (
              <li key={msg._id || Math.random()} className={`flex flex-col ${msg.sender === user._id ? 'items-end' : 'items-start'}`}>
                <div className={`px-3 py-1 rounded ${msg.sender === user._id ? 'bg-blue-200' : 'bg-gray-200'}`}>
                  <span className="font-semibold text-xs text-gray-700">{msg.sender?.name || (msg.sender === user._id ? 'You' : 'User')}</span>
                  <span className="block text-sm">{msg.content}</span>
                </div>
                <span className="text-xs text-gray-400 mt-1">{msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString() : ''}</span>
              </li>
            ))}
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