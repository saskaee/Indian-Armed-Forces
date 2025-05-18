import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { Server } from 'socket.io';
import http from 'http';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'; // In production, use environment variable

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('Missing Supabase configuration. Auth functionality may not work correctly.');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Mock database for non-auth data
const mockInterviews = [
  {
    id: 1,
    question: "Why do you want to join the Armed Forces?",
    expectedPoints: [
      "Sense of duty towards nation",
      "Family tradition of service",
      "Leadership opportunities",
      "Challenging career"
    ]
  },
  {
    id: 2,
    question: "How do you handle pressure situations?",
    expectedPoints: [
      "Stay calm and focused",
      "Prioritize tasks",
      "Follow standard procedures",
      "Learn from experience"
    ]
  }
];

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Authentication middleware using Supabase JWT
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  try {
    // Verify the JWT using Supabase
    const { data, error } = await supabase.auth.getUser(token);
    
    if (error) {
      console.error('Auth error:', error);
      return res.sendStatus(403);
    }
    
    req.user = data.user;
    next();
  } catch (err) {
    console.error('Token verification error:', err);
    return res.sendStatus(403);
  }
};

// Auth Routes
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Use Supabase to create a new user
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { username }
    });

    if (error) {
      console.error('Registration error:', error);
      return res.status(400).json({ message: error.message });
    }
    
    // Return the session tokens
    res.status(201).json({
      user: data.user,
      token: data.session ? data.session.access_token : null
    });
  } catch (error) {
    console.error('Server error during registration:', error);
    res.status(500).json({ message: 'Error creating user' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Use Supabase to sign in the user
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error('Login error:', error);
      return res.status(400).json({ message: error.message });
    }

    // Return the session tokens
    res.json({
      user: data.user,
      token: data.session.access_token
    });
  } catch (error) {
    console.error('Server error during login:', error);
    res.status(500).json({ message: 'Error logging in' });
  }
});

// Password reset request
app.post('/api/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password`,
    });

    if (error) {
      console.error('Password reset error:', error);
      return res.status(400).json({ message: error.message });
    }

    res.json({ message: 'Password reset email sent' });
  } catch (error) {
    console.error('Server error during password reset:', error);
    res.status(500).json({ message: 'Error sending password reset email' });
  }
});

// Get current user info
app.get('/api/me', authenticateToken, async (req, res) => {
  try {
    res.json({ user: req.user });
  } catch (error) {
    console.error('Error fetching user info:', error);
    res.status(500).json({ message: 'Error fetching user information' });
  }
});

app.get('/api/mock-interview/questions', authenticateToken, (req, res) => {
  res.json(mockInterviews);
});

// Contact form endpoint
app.post('/api/contact', (req, res) => {
  const { name, email, phone, subject, message } = req.body;
  
  console.log('Contact form submission:', { name, email, phone, subject, message });
  
  setTimeout(() => {
    res.status(200).json({ success: true, message: 'Your message has been received' });
  }, 1000);
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-interview', (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined interview room ${roomId}`);
  });

  socket.on('submit-answer', (data) => {
    // Simulate AI evaluation
    const score = Math.floor(Math.random() * 10) + 1;
    socket.emit('answer-feedback', {
      score,
      feedback: `Your answer scored ${score}/10. ${score > 7 ? 'Excellent work!' : 'Keep practicing!'}`
    });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Start the server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});