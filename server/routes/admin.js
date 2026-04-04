const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin");
const authMiddleware = require("../middleware/auth");
const isAdmin = require("../middleware/admin");

router.use(authMiddleware);
router.use(isAdmin);

router.get('/users', adminController.getAllUsers);
router.get('/stats', adminController.getStats);
router.get('/conversations/:id', adminController.getConversations);
router.get('/top-intentions', adminController.getTopIntentions);
router.delete('/users/:id', adminController.deleteUser);

module.exports = router;