import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import http from 'http';
import session from 'express-session';
import passport from 'passport';

import connectDB from './db.js';
import setupPassport from './passportSetup.js';
import apiRoutes from './routes/apiRoutes.js';
import authRoutes from './routes/authRoutes.js';
import setupSocket from './socket/index.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3009;

// Middleware
app.use(cors());
app.use(express.json());
app.use(session({ secret: 'secret', resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

// Connect DB
await connectDB();

// Setup passport strategies
setupPassport(passport);

// Routes
app.use('/api', apiRoutes);
app.use('/', authRoutes);

// Create HTTP & Socket.io server
const server = http.createServer(app);
setupSocket(server);

server.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});
