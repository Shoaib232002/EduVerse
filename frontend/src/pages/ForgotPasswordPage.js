import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { forgotPassword } from '../store/authSlice';
import { Link, useNavigate } from 'react-router-dom';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await dispatch(forgotPassword(email)).unwrap();
      setMessage('An OTP has been sent to your email.');
      setTimeout(() => navigate('/reset-password'), 1000);
    } catch (error) {
      setMessage(error.message || 'Failed to send OTP.');
    }
  };

  return (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-800 via-violet-900 to-gray-900 relative overflow-hidden">
    {/* 3D Glow Orbs */}
    <div className="absolute w-72 h-72 bg-purple-600 opacity-30 rounded-full -top-20 -left-20 blur-3xl animate-pulse z-0" />
    <div className="absolute w-96 h-96 bg-indigo-500 opacity-20 rounded-full -bottom-32 -right-32 blur-2xl animate-spin-slow z-0" />

    <div className="relative z-10 backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-2xl p-10 w-full max-w-md transition-transform transform hover:scale-[1.02] duration-500">
      <h2 className="text-3xl font-extrabold text-white text-center drop-shadow mb-6">
        Forgot Password
      </h2>

      <form className="space-y-5" onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Enter your email"
          className="w-full px-5 py-3 rounded-xl bg-white/20 text-white placeholder-gray-200 border border-white/30 focus:outline-none focus:ring-2 focus:ring-purple-400 shadow-inner"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button
          type="submit"
          className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-indigo-600 hover:to-purple-500 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
        >
          Send OTP
        </button>
      </form>

      {message && (
        <div className="text-center mt-4 text-sm text-green-300">
          {message}
        </div>
      )}

      <div className="mt-6 text-center text-sm text-gray-300">
        <Link to="/login" className="hover:text-white hover:underline">
          Back to Login
        </Link>
      </div>
    </div>
  </div>
);

};

export default ForgotPasswordPage; 