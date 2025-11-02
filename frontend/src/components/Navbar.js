import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../store/authSlice';
import Notifications from './Notifications';
import { BookOpen } from 'lucide-react';

const Navbar = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);

  // Scroll background effect
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-500 ${
        isScrolled
          ? 'bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-2xl border-b border-gray-200/20'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto flex justify-between items-center px-8 py-4">
        {/* Logo + Branding */}
        <Link to="/" className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-black bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            EduVerse
          </h1>
        </Link>

        {/* Right Actions */}
        <div className="flex items-center space-x-6">
          {user ? (
            <>
              {/* Notifications with separator */}
              <div className="flex items-center">
                <Notifications />
                <div className="h-6 w-px bg-gray-300 dark:bg-gray-700 mx-4"></div>
              </div>
              {user.role === 'student' && (
                <Link
                  to="/dashboard/student"
                  className="text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 font-medium transition"
                >
                  Dashboard
                </Link>
              )}
              {user.role === 'teacher' && (
                <Link
                  to="/dashboard/teacher"
                  className="text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 font-medium transition"
                >
                  Dashboard
                </Link>
              )}
              {user.role === 'admin' && (
                <Link
                  to="/dashboard/admin"
                  className="text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 font-medium transition"
                >
                  Dashboard
                </Link>
              )}
              <Link
                to="/classes"
                className="text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 font-medium transition"
              >
                My Classes
              </Link>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white font-medium px-5 py-2 rounded-full transition-all duration-200 shadow hover:scale-105"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="px-6 py-2.5 text-gray-700 dark:text-gray-300 font-medium hover:text-purple-600 dark:hover:text-purple-400 transition-all duration-300"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full font-medium hover:from-purple-700 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 transform"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
