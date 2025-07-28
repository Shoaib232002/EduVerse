# Virtual Classroom Platform

A full-stack web platform for virtual classrooms, featuring real-time video, chat, collaborative whiteboard, assignments, notes, and more.

## Tech Stack
- **Frontend:** React.js, Tailwind CSS
- **Backend:** Node.js, Express.js
- **Database:** MongoDB (Mongoose)
- **Real-Time:** Socket.IO
- **Video Conferencing:** WebRTC/Agora.js
- **Whiteboard:** Fabric.js
- **File Uploads:** Multer, Cloudinary
- **Auth:** JWT, Google OAuth2

## Features
- Authentication (JWT, Google OAuth, OTP reset, roles)
- Student/Teacher/Admin dashboards
- Real-time classroom (video, chat, whiteboard)
- Assignments (upload, submit, grade)
- Notes sharing
- Schedule & calendar
- Notifications (real-time, email)

## Setup

### Backend
```bash
cd backend
cp .env.example .env
npm install
npm start
```

### Frontend
```bash
cd frontend
cp .env.example .env
npm install
npm start
```
