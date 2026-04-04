const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chat")
const authMiddleware = require("../middleware/auth")

router.post('/', authMiddleware, chatController.handleChat);
router.get('/history', authMiddleware, chatController.getHistory);

module.exports =router;