require('dotenv').config();
const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const socketio = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = socketio(server, { cors: { origin: process.env.CLIENT_URL, credentials: true } });

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Make io available to routes
app.set('io', io);

// MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err));

// Routes
const apiRouter = require('./src/routes');
app.use('/api', apiRouter);

// Socket.IO
require('./src/sockets')(io);


const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));