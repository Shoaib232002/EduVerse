require('dotenv').config();
const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const socketio = require('socket.io');
const passport = require('passport');
const session = require('express-session');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const path = require('path');
const User = require('./src/models/User');
const jwt = require('jsonwebtoken');

const app = express();
const server = http.createServer(app);
const io = socketio(server, { cors: { origin: process.env.CLIENT_URL, credentials: true } });

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware (required for Passport)
app.use(session({
  secret: process.env.SESSION_SECRET || 'your_session_secret',
  resave: false,
  saveUninitialized: false,
}));

app.use(passport.initialize());
app.use(passport.session());

// User serialization
passport.serializeUser((user, done) => {
  done(null, user);
});
passport.deserializeUser((user, done) => {
  done(null, user);
});

// Google OAuth Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL,
}, (accessToken, refreshToken, profile, done) => {
  // Here, you can find or create the user in your DB
  // For now, just return the profile
  return done(null, profile);
}));

// Auth routes
app.get('/api/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/api/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  async (req, res) => {
    try {
      const googleProfile = req.user;
      console.log('Google Profile:', googleProfile);
      const email = googleProfile.emails[0].value;
      let user = await User.findOne({ email });
      if (!user) {
        // Create user if not found
        user = await User.create({
          name: googleProfile.displayName,
          email,
          googleId: googleProfile.id,
          role: 'student' // Default role, or customize as needed
        });
      }
      // Generate JWT
      const token = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
      // Determine redirect path based on role
      let dashboardPath = '/dashboard/student';
      if (user.role === 'teacher') dashboardPath = '/dashboard/teacher';
      else if (user.role === 'admin') dashboardPath = '/dashboard/admin';
      // Redirect to frontend with token and role
      res.redirect(`http://localhost:3000/oauth-success?token=${token}&role=${user.role}`);
    } catch (err) {
      console.error('Google OAuth callback error:', err);
      res.redirect('http://localhost:3000/login?error=oauth');
    }
  }
);

app.set('io', io);

// MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err));

// Routes
const authRouter = require('./src/routes/auth');
const classRouter = require('./src/routes/class');
app.use('/api/classes', classRouter);
const assignmentRouter = require('./src/routes/assignment');
app.use('/api/assignments', assignmentRouter);
const meetingRouter = require('./src/routes/meeting');

app.use('/api/auth', authRouter);
app.use('/api/meetings', meetingRouter);
const apiRouter = require('./src/routes');
app.use('/api', apiRouter);

// Socket.IO
require('./src/sockets')(io);


const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));