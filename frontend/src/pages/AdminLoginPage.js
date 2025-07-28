import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { login } from '../store/authSlice';
import { useNavigate } from 'react-router-dom';

const AdminLoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, loading, error, token } = useSelector((state) => state.auth);

  useEffect(() => {
    if (user && token && user.role === 'admin') {
      navigate('/dashboard/admin', { replace: true });
    }
  }, [user, token, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    try {
      await dispatch(login({ email, password })).unwrap();
    } catch (err) {
      // Error handled by Redux state
    }
  };

  return (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 relative overflow-hidden">
    {/* Glowing 3D Background Orbs */}
    <div className="absolute w-72 h-72 bg-blue-600 opacity-30 rounded-full -top-20 -left-20 blur-3xl animate-pulse z-0" />
    <div className="absolute w-96 h-96 bg-indigo-500 opacity-20 rounded-full -bottom-32 -right-32 blur-2xl animate-spin-slow z-0" />

    <div className="relative z-10 backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-2xl p-10 w-full max-w-md transition-transform transform hover:scale-[1.02] duration-500">
      <h2 className="text-3xl font-extrabold text-white text-center drop-shadow mb-6">
        Admin Login
      </h2>

      <form className="space-y-5" onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Admin Email"
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

      <div className="mt-6 text-center text-sm text-gray-300">
        <a href="/login" className="hover:text-white hover:underline">
          Back to User Login
        </a>
      </div>
    </div>
  </div>
);

};

export default AdminLoginPage;