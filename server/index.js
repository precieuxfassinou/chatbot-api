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


const app = express();
const PORT = process.env.PORT || 3000;


const httpServer = createServer(app);
const io = new Server(httpServer,{
    cors: {
        origin: ['http://localhost:5173', 'https://chatbot-api-wine.vercel.app'],
        credentials: true
    }
});

io.on('connection', (socket) => {
    console.log('Client connecté : ' + socket.id);

    socket.on('message', async (data) => {
        const analysis = await analyzeMessage(data.message);
        const response = await getResponse(data.message, analysis);
        socket.emit('response', { response });
        socket.emit('done');
    });

    socket.on('disconnect', () => {
        console.log('Client déconnecté : ' + socket.id);
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
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = { app, io };