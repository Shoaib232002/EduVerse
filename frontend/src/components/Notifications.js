import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import { FaBullhorn, FaBell, FaBook, FaStar, FaFileAlt, FaUser } from 'react-icons/fa';

const SOCKET_URL = 'http://localhost:5000'; // Make sure this matches your backend server URL
const DEBUG = true; // Enable debug logging
const RECONNECTION_ATTEMPTS = 5;
const RECONNECTION_DELAY = 1000;

const Notifications = () => {
  // Memoize the user selector to prevent unnecessary rerenders
  const user = useSelector((state) => state.auth.user, 
    (prev, next) => prev?._id === next?._id && prev?.role === next?.role
  );
  
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [unread, setUnread] = useState(0);
  const socketRef = useRef();
  const notificationsRef = useRef(notifications); // Keep a ref to latest notifications
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  
  // Load notifications from localStorage on mount
  useEffect(() => {
    const savedNotifications = localStorage.getItem('notifications');
    if (savedNotifications) {
      try {
        const parsedNotifications = JSON.parse(savedNotifications);
        setNotifications(parsedNotifications);
        // Set unread count for loaded notifications
        const unreadCount = parsedNotifications.filter(n => !n.read).length;
        setUnread(unreadCount);
      } catch (error) {
        console.error('Error loading notifications from localStorage:', error);
      }
    }
  }, []);

  // Memoized cleanup function to prevent recreating on each render
  const cleanupSocket = useCallback(() => {
    if (DEBUG) console.log('[Notifications] Running socket cleanup...');
    if (socketRef.current) {
      // Remove all listeners to prevent memory leaks
      const events = ['connect', 'disconnect', 'connect_error', 'reconnect', 'notification'];
      events.forEach(event => {
        socketRef.current.removeAllListeners(event);
        if (DEBUG) console.log(`[Notifications] Removed listeners for ${event}`);
      });
      
      // Leave all rooms
      if (user?._id) {
        socketRef.current.emit('leaveClass', { 
          userId: user._id,
          role: user.role 
        });
      }
      
      // Disconnect socket
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  }, [user]);

  // Function to fetch initial notifications
  const fetchInitialNotifications = async () => {
    try {
      const hasShownWelcome = localStorage.getItem('welcomeShown');
      const savedNotifications = localStorage.getItem('notifications');
      let currentNotifications = [];

      // Parse saved notifications if they exist
      if (savedNotifications) {
        try {
          currentNotifications = JSON.parse(savedNotifications);
        } catch (error) {
          console.error('Error parsing saved notifications:', error);
        }
      }

      // Add welcome notification if not shown before
      if (!hasShownWelcome && user) {
        const welcomeNotification = {
          id: Date.now(),
          type: 'welcome',
          message: `Welcome ${user.name}!`,
          data: {},
          timestamp: new Date().toISOString(),
          read: false
        };
        currentNotifications = [welcomeNotification, ...currentNotifications];
        localStorage.setItem('welcomeShown', 'true');
      }

      // Update state
      setNotifications(currentNotifications);
      const unreadCount = currentNotifications.filter(n => !n.read).length;
      setUnread(unreadCount);
      
      // Save to localStorage
      localStorage.setItem('notifications', JSON.stringify(currentNotifications));
    } catch (error) {
      console.error('Error in fetchInitialNotifications:', error);
    }
  };

  // Keep a reference to the latest notifications
  useEffect(() => {
    notificationsRef.current = notifications;
  }, [notifications]);

  // Fetch initial notifications on mount
  useEffect(() => {
    if (user) {
      fetchInitialNotifications();
    }
  }, [user]);

  // Socket connection setup and notification handling
  useEffect(() => {
    if (!user?._id) return;

    if (DEBUG) console.log('[Notifications] Setting up socket connection for user:', user._id);
    
    // Initialize socket
    const socket = io(SOCKET_URL, {
      transports: ['websocket'],
      auth: { token: localStorage.getItem('token'), userId: user._id },
      reconnection: true,
      reconnectionAttempts: RECONNECTION_ATTEMPTS,
      reconnectionDelay: RECONNECTION_DELAY,
      query: { userId: user._id, role: user.role }
    });

    socketRef.current = socket;

    // Connect and handle events
    socket.on('connect', () => {
      if (DEBUG) console.log('[Notifications] Socket connected successfully, joining rooms...');
      
      // Join personal room for notifications and all user's classes
      socket.emit('joinClass', { 
        userId: user._id,
        role: user.role
      }, (response) => {
        if (response?.success) {
          console.log('[Notifications] Successfully joined notification rooms');
        }
      });
    });
    
    socket.on('connect_error', (error) => {
      console.error('[Notifications] Socket connection error:', error);
    });

    socket.on('reconnect', (attempt) => {
      if (DEBUG) console.log('[Notifications] Socket reconnected after', attempt, 'attempts');
      socket.emit('joinClass', { 
        userId: user._id,
        role: user.role 
      }, (response) => {
        if (response?.success) {
          console.log('[Notifications] Successfully rejoined rooms after reconnection');
        }
      });
    });

    socket.on('disconnect', (reason) => {
      console.log('[Notifications] Socket disconnected:', reason);
      if (reason === 'io server disconnect') {
        socket.connect();
      }
    });

    // Set up notification handling
    socket.on('notification', (data) => {
      if (!data?.type || !data?.message) {
        console.warn('[Notifications] Invalid notification data received:', data);
        return;
      }

      if (DEBUG) {
        console.log('[Notifications] Received notification:', data);
        console.log('[Notifications] Socket ID:', socket.id);
        console.log('[Notifications] Connected:', socket.connected);
      }
      
      // Filter for specific notification types
      const validTypes = ['assignment', 'note', 'grade', 'announcement', 'system'];
      if (!validTypes.includes(data.type) && data.type !== 'welcome') {
        console.warn('[Notifications] Invalid notification type:', data.type);
        return;
      }
      
      // For system notifications, log but don't display
      if (data.type === 'system') {
        if (DEBUG) console.log('[Notifications] System notification:', data.message);
        return;
      }

      // For non-system notifications, check if this is for the current user
      if (data.userId && data.userId !== user?._id) {
        if (DEBUG) {
          console.log('[Notifications] Notification not for current user:', {
            notificationUserId: data.userId,
            currentUserId: user?._id
          });
        }
        return;
      }

      setNotifications((prev) => {
        // Check if this notification already exists
        const exists = prev.some(n => 
          n.type === data.type && 
          n.message === data.message &&
          Date.now() - n.id < 1000 // Within last second
        );
        
        if (exists) return prev;
        
        const newNotification = { 
          ...data, 
          id: Date.now(),
          timestamp: new Date().toISOString(),
          read: false
        };

        // Format the notification message based on type
        switch (data.type) {
          case 'assignment':
            newNotification.message = `New assignment: ${data.data?.title || 'Untitled'}`;
            break;
          case 'note':
            newNotification.message = `New study material: ${data.data?.title || 'Untitled'}`;
            break;
          case 'grade':
            newNotification.message = `Your assignment "${data.data?.title}" has been graded`;
            break;
          case 'announcement':
            newNotification.message = `New announcement in ${data.data?.className || 'your class'}`;
            break;
          case 'welcome':
            newNotification.message = data.message; // Keep original welcome message
            break;
        }
        
        // Keep only the last 20 notifications
        const updatedNotifications = [newNotification, ...prev].slice(0, 20);
        
        // Save to localStorage
        localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
        
        if (DEBUG) console.log('Updated notifications:', updatedNotifications);
        
        return updatedNotifications;
      });
      
      // Increment unread count for non-welcome notifications
      if (data.type !== 'welcome') {
        setUnread((u) => u + 1);
      }
    });
    
    // Handle clicks outside the dropdown to close it
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    
    // Use the memoized cleanup function
    return () => {
      cleanupSocket();
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [user?._id, cleanupSocket]); // Add user._id and cleanupSocket to dependencies

  const handleBellClick = () => {
    setShowDropdown((show) => !show);
    if (!showDropdown) {
      // Mark all as read when opening dropdown
      setNotifications(prev => {
        const updatedNotifications = prev.map(n => ({ ...n, read: true }));
        localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
        return updatedNotifications;
      });
      setUnread(0);
    }
  };
  
  const handleNotificationClick = (notification) => {
    if (!notification.data) return;

    // Navigate to the appropriate page based on notification type
    switch (notification.type) {
      case 'assignment':
        if (notification.data.assignmentId && notification.data.class) {
          navigate(`/classes/${notification.data.class}/assignments/${notification.data.assignmentId}`);
        }
        break;
      case 'note':
        if (notification.data.noteId && notification.data.class) {
          navigate(`/classes/${notification.data.class}/notes/${notification.data.noteId}`);
        }
        break;
      case 'announcement':
        if (notification.data.class) {
          navigate(`/classes/${notification.data.class}`);
        }
        break;
      case 'grade':
        if (notification.data.assignmentId && notification.data.class) {
          navigate(`/classes/${notification.data.class}/assignments/${notification.data.assignmentId}`);
        }
        break;
      default:
        // For welcome or other notifications, do nothing
        break;
    }
    setShowDropdown(false);
  };

  return (
    <div className="relative inline-block text-left">
      <button 
        onClick={handleBellClick} 
        className="relative focus:outline-none p-2 hover:bg-gray-100 rounded-full transition-all duration-300 transform hover:scale-110"
      >
        <FaBell className={`text-xl ${unread > 0 ? 'text-purple-600' : 'text-gray-700'} transform transition-all duration-300 ${unread > 0 ? 'animate-bounce' : ''}`} />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
            {unread}
          </span>
        )}
      </button>

      {showDropdown && (
        <div ref={dropdownRef} className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg z-50 overflow-hidden border border-gray-200">
          <div className="p-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold flex items-center justify-between">
            <span className="flex items-center">
              <FaBell className="mr-2" />
              Notifications
            </span>
            {notifications.length > 0 && (
              <button 
                onClick={() => {
                  setNotifications([]);
                  setUnread(0);
                }}
                className="text-xs bg-white bg-opacity-20 hover:bg-opacity-30 px-2 py-1 rounded transition-colors"
              >
                Clear all
              </button>
            )}
          </div>

          <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center">
                <div className="flex flex-col items-center justify-center">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                    <FaBell className="text-2xl text-purple-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">All Caught Up!</h3>
                  <p className="text-gray-500 mb-1">Your notifications will appear here</p>
                  <p className="text-sm text-gray-400">
                    {user.role === 'student' 
                      ? 'Stay updated with your classes and assignments'
                      : 'Manage your classes and students'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((n) => (
                  <div 
                    key={n.id} 
                    className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => handleNotificationClick(n)}
                  >
                    <div className="flex items-start">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center text-white">
                        {n.type === 'announcement' && <FaBullhorn />}
                        {n.type === 'assignment' && <FaBook />}
                        {n.type === 'grade' && <FaStar />}
                        {n.type === 'note' && <FaFileAlt />}
                        {n.type === 'welcome' && <FaUser />}
                      </div>
                      <div className="ml-3 flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {n.type.charAt(0).toUpperCase() + n.type.slice(1)}
                        </p>
                        <p className="text-sm text-gray-500">{n.message}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(n.timestamp).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit',
                            hour12: true 
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications;