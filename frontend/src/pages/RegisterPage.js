import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { register } from '../store/authSlice';
import { useNavigate, Link } from 'react-router-dom';

const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role] = useState('student'); // Always student
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, loading, error } = useSelector((state) => state.auth);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      return; // Don't redirect if no token exists
    }
    
    if (user && token) {
      switch(user.role) {
        case 'student':
          navigate('/dashboard/student', { replace: true });
          break;
        case 'teacher':
          navigate('/dashboard/teacher', { replace: true });
          break;
        case 'admin':
          navigate('/dashboard/admin', { replace: true });
          break;
        default:
          break;
      }
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      return;
    }
    try {
      const result = await dispatch(register({ name, email, password, role })).unwrap();
      if (result?.token) {
        localStorage.setItem('token', result.token);
      }
    } catch (err) {
      console.error('Registration failed:', err);
    }
  };

  return (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-800 to-gray-900 relative overflow-hidden">
    {/* Animated background orbs for 3D illusion */}
    <div className="absolute w-72 h-72 bg-indigo-600 opacity-30 rounded-full -top-20 -left-20 blur-3xl animate-pulse z-0" />
    <div className="absolute w-96 h-96 bg-purple-500 opacity-20 rounded-full -bottom-32 -right-32 blur-2xl animate-spin-slow z-0" />

    <div className="relative z-10 backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-2xl p-10 w-full max-w-md transition-transform transform hover:scale-[1.02] duration-500">
      <h2 className="text-3xl font-extrabold text-white text-center drop-shadow mb-6">Register</h2>

      <form className="space-y-5" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Name"
          className="w-full px-5 py-3 rounded-xl bg-white/20 text-white placeholder-gray-200 border border-white/30 focus:outline-none focus:ring-2 focus:ring-purple-400 shadow-inner"
          value={name}
          onChange={e => setName(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder="Email"
          className="w-full px-5 py-3 rounded-xl bg-white/20 text-white placeholder-gray-200 border border-white/30 focus:outline-none focus:ring-2 focus:ring-purple-400 shadow-inner"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full px-5 py-3 rounded-xl bg-white/20 text-white placeholder-gray-200 border border-white/30 focus:outline-none focus:ring-2 focus:ring-purple-400 shadow-inner"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <button
          type="submit"
          className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-indigo-600 hover:to-purple-500 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
          disabled={loading}
        >
          {loading ? 'Registering...' : 'Register'}
        </button>
      </form>

      {error && <div className="text-red-400 text-center mt-3">{error}</div>}

      <div className="mt-6 text-center text-sm text-gray-300">
        <a href="/login" className="hover:text-white hover:underline">Already have an account?</a>
      </div>
    </div>
  </div>
);
};

export default RegisterPage;