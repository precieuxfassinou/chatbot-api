const express = require('express');
const chatRoutes = require("./routes/chat");
const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");
const { analyzeMessage, getResponse } = require('./controllers/chat');
const cors = require('cors')
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
dotenv.config();
const { createServer } = require('http');
const { Server } = require('socket.io');
const jwt = require("jsonwebtoken");
const pool = require('./config/db');
const { getOrCreateConversation } = require('./controllers/chat');


const app = express();
const PORT = process.env.PORT || 3000;


const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:5173', 'https://chatbot-api-wine.vercel.app'],
    credentials: true
  }
});

io.on('connection', (socket) => {
  console.log('Client connecté : ' + socket.id);

  socket.on('message', async (data) => {
    try {
      const { message, token } = data;

      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      const userId = decoded.id;

      const conversation = await getOrCreateConversation(userId);

      const historyResult = await pool.query(
        "SELECT sender, content FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC LIMIT 10",
        [conversation.id]
      );
      const history = historyResult.rows;

      const analysis = await analyzeMessage(message);

      const response = await getResponse(message, analysis, history);

      await pool.query(
        "INSERT INTO messages (conversation_id, sender, content) VALUES ($1, 'user', $2)",
        [conversation.id, message]
      );

      await pool.query(
        "INSERT INTO messages (conversation_id, sender, content, intention) VALUES ($1, 'bot', $2, $3)",
        [conversation.id, response, analysis.intention]
      );

      socket.emit('response', { response });
    } catch (error) {
      console.error('Socket error:', error.message);
      socket.emit('error', { message: 'Erreur serveur' });
    }
  });
});

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'https://chatbot-api-wine.vercel.app'],
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());
app.use('/chat', chatRoutes);
app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to chatbot API' });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Start server
if (require.main === module) {
  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = { app, io, httpServer };