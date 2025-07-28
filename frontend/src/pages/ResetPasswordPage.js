import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { resetPassword } from '../store/authSlice';
import { useNavigate, Link } from 'react-router-dom';

const ResetPasswordPage = () => {
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setMessage('Passwords do not match.');
      return;
    }
    try {
      await dispatch(resetPassword({ otp, password, confirmPassword })).unwrap();
      setMessage('Password has been reset successfully. You can now log in.');
      setTimeout(() => navigate('/login'), 3000);
    } catch (error) {
      setMessage(error.message || 'Failed to reset password.');
    }
  };

  return (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-fuchsia-800 via-indigo-900 to-gray-900 relative overflow-hidden">
    {/* 3D glowing orbs */}
    <div className="absolute w-72 h-72 bg-fuchsia-600 opacity-30 rounded-full -top-20 -left-20 blur-3xl animate-pulse z-0" />
    <div className="absolute w-96 h-96 bg-indigo-500 opacity-20 rounded-full -bottom-32 -right-32 blur-2xl animate-spin-slow z-0" />

    <div className="relative z-10 backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-2xl p-10 w-full max-w-md transition-transform transform hover:scale-[1.02] duration-500">
      <h2 className="text-3xl font-extrabold text-white text-center drop-shadow mb-6">
        Reset Password
      </h2>

      <form className="space-y-5" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Enter OTP"
          className="w-full px-5 py-3 rounded-xl bg-white/20 text-white placeholder-gray-200 border border-white/30 focus:outline-none focus:ring-2 focus:ring-pink-400 shadow-inner"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="New Password"
          className="w-full px-5 py-3 rounded-xl bg-white/20 text-white placeholder-gray-200 border border-white/30 focus:outline-none focus:ring-2 focus:ring-pink-400 shadow-inner"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Confirm New Password"
          className="w-full px-5 py-3 rounded-xl bg-white/20 text-white placeholder-gray-200 border border-white/30 focus:outline-none focus:ring-2 focus:ring-pink-400 shadow-inner"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        <button
          type="submit"
          className="w-full bg-gradient-to-r from-pink-500 to-indigo-600 hover:from-indigo-600 hover:to-pink-500 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
        >
          Reset Password
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

export default ResetPasswordPage; 