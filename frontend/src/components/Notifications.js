import React, { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import io from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';

const Notifications = () => {
  const { user } = useSelector((state) => state.auth);
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [unread, setUnread] = useState(0);
  const socketRef = useRef();

  useEffect(() => {
    if (!user) return;
    socketRef.current = io(SOCKET_URL, { transports: ['websocket'] });
    socketRef.current.emit('joinClass', { classId: null, userId: user._id });
    socketRef.current.on('notification', (data) => {
      setNotifications((prev) => [{ ...data, id: Date.now() }, ...prev]);
      setUnread((u) => u + 1);
    });
    return () => {
      socketRef.current.disconnect();
    };
  }, [user]);

  const handleBellClick = () => {
    setShowDropdown((show) => !show);
    setUnread(0);
  };

  return (
    <div className="relative inline-block text-left">
      <button onClick={handleBellClick} className="relative focus:outline-none">
        <span className="material-icons text-2xl">🔊</span>
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1">{unread}</span>
        )}
      </button>
      {showDropdown && (
        <div className="absolute right-0 mt-2 w-64 bg-white border rounded shadow-lg z-50">
          <div className="p-2 font-semibold border-b">Notifications</div>
          <ul className="max-h-64 overflow-y-auto">
            {notifications.length === 0 && <li className="p-2 text-gray-500">No notifications</li>}
            {notifications.map((n) => (
              <li key={n.id} className="p-2 border-b last:border-b-0 text-sm">
                <span className="font-semibold">{n.type === 'assignment' ? 'Assignment' : n.type === 'grade' ? 'Grade' : 'Notification'}:</span> {n.message}
              </li>
            ))}
          </ul>
        </div>
      )}
      {/* Toasts */}
      <div className="fixed bottom-4 right-4 space-y-2 z-50">
        {notifications.slice(0, 3).map((n) => (
          <div key={n.id} className="bg-blue-600 text-white px-4 py-2 rounded shadow animate-bounce-in">
            {n.message}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Notifications; 