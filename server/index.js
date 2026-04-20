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

// --- Auth middleware pour Socket.io ---
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Token manquant'));
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    socket.userId = decoded.id;
    next();
  } catch (err) {
    next(new Error('Token invalide'));
  }
});

io.on('connection', (socket) => {
  console.log(`Client connecté : ${socket.id} (user ${socket.userId})`);
  socket.join(`user:${socket.userId}`);

  socket.on('message', async (data) => {
    try {
      const { message } = data;
      const userId = socket.userId;

      const { conversation, isNew } = await getOrCreateConversation(userId);

      // Si une nouvelle conv a été créée suite à un timeout détecté
      // au moment du message → prévenir le client
      if (isNew) {
        io.to(`user:${userId}`).emit('conversation:created', {
          conversation,
          reason: 'inactivity_timeout_on_message'
        });
      }

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

      socket.emit('response', { response, conversationId: conversation.id });
    } catch (error) {
      console.error('Socket error:', error.message);
      socket.emit('error', { message: 'Erreur serveur' });
    }
  });
});

// --- Scanner d'inactivité (vraie notif pendant que le user ne fait rien) ---
const INACTIVITY_TIMEOUT_MS = process.env.NODE_ENV === 'production'
  ? 48 * 60 * 60 * 1000   // 48h en prod
  : 3 * 60 * 1000;         // 3 min en dev
const SCAN_INTERVAL_MS = 30 * 1000; // scan toutes les 30s

async function scanInactiveConversations() {
  try {
    // 1. Trouver les conv actives dépassant le timeout
    const expired = await pool.query(
      `SELECT id, user_id FROM conversations
       WHERE status = 'active'
         AND last_activity < NOW() - ($1::int * INTERVAL '1 millisecond')`,
      [INACTIVITY_TIMEOUT_MS]
    );

    for (const row of expired.rows) {
      // 2. Clôturer
      await pool.query(
        "UPDATE conversations SET status = 'inactive' WHERE id = $1",
        [row.id]
      );
      // 3. Créer la nouvelle conv
      const created = await pool.query(
        "INSERT INTO conversations (user_id, status, last_activity) VALUES ($1, 'active', NOW()) RETURNING *",
        [row.user_id]
      );
      // 4. Notifier le user s'il est connecté
      io.to(`user:${row.user_id}`).emit('conversation:created', {
        conversation: created.rows[0],
        reason: 'inactivity_timeout'
      });
      console.log(`Nouvelle conv ${created.rows[0].id} pour user ${row.user_id} (timeout)`);
    }
  } catch (err) {
    console.error('Scanner erreur:', err.message);
  }
}

setInterval(scanInactiveConversations, SCAN_INTERVAL_MS);

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