import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { login } from '../store/authSlice';
import { useNavigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';

const LoginPage = ({ isAdminLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, loading, error, token } = useSelector((state) => state.auth);
  const location = useLocation();
  const adminMode = isAdminLogin || location.pathname === '/login/admin';

  useEffect(() => {
    // Clear any existing tokens if we're on the login page
    if (!user && !token) {
      localStorage.removeItem('token');
    }
  }, []);

  useEffect(() => {
    if (user && token) {
      const path = user.role === 'student' ? '/dashboard/student' :
                  user.role === 'teacher' ? '/dashboard/teacher' :
                  user.role === 'admin' ? '/dashboard/admin' : '/';
      navigate(path, { replace: true });
    }
  }, [user, token, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    
    try {
      await dispatch(login({ email, password })).unwrap();
    } catch (err) {
      console.error('Login failed:', err);
    }
  };

  return (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-gray-900 relative overflow-hidden">
    {/* 3D Glow Background Circles */}
    <div className="absolute w-72 h-72 bg-purple-700 opacity-30 rounded-full -top-20 -left-20 blur-3xl transform rotate-45 animate-pulse z-0" />
    <div className="absolute w-96 h-96 bg-blue-500 opacity-20 rounded-full -bottom-32 -right-32 blur-2xl transform scale-105 animate-spin-slow z-0" />

    <div className="relative z-10 backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-2xl p-10 w-full max-w-md transition-transform transform hover:scale-[1.02] duration-500">
      <h2 className="text-3xl font-extrabold text-white text-center drop-shadow mb-6">
        {adminMode ? 'Admin Login' : 'Login'}
      </h2>

      <form className="space-y-5" onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          className="w-full px-5 py-3 rounded-xl bg-white/20 text-white placeholder-gray-200 border border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-inner"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full px-5 py-3 rounded-xl bg-white/20 text-white placeholder-gray-200 border border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-inner"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <button
          type="submit"
          className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-indigo-600 hover:to-blue-500 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
          disabled={loading}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      {error && <div className="text-red-400 text-center mt-3">{error}</div>}

      <div className="mt-6 text-center text-sm text-gray-300 space-y-1">
        <div>
          <a href="/forgot-password" className="hover:text-white hover:underline">Forgot password?</a>
          <span className="mx-2 text-gray-500">|</span>
          <a href="/register" className="hover:text-white hover:underline">Register?</a>
        </div>
        <a href="/login/admin" className="hover:text-white hover:underline">Login as Admin</a>
      </div>
    </div>
  </div>
);

};

export default LoginPage;