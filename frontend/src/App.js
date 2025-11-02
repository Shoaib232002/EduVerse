import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import StudentDashboard from './pages/StudentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ClassroomPage from './pages/ClassroomPage';
import ClassPage from './pages/ClassPage';
import ProtectedRoute from './components/ProtectedRoute';
import JoinClassPage from './pages/JoinClassPage';
import AdminLoginPage from './pages/AdminLoginPage';
import ClassesPage from './pages/ClassesPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/login/admin" element={<AdminLoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/join/:joinCode" element={<JoinClassPage />} />
        <Route path="/classroom/:id" element={<ClassroomPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard/student" element={<StudentDashboard />} />
          <Route path="/dashboard/teacher" element={<TeacherDashboard />} />
          <Route path="/dashboard/admin" element={<AdminDashboard />} />
          <Route path="/classes" element={<ClassesPage />} />
          <Route path="/class/:classId" element={<ClassPage />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
