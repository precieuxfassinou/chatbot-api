const pool = require('../config/db');

async function getAllUsers(req, res) {
    try {
        const result = await pool.query('SELECT id, firstname, lastname, email, role FROM users');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Erreur serveur' });
    }
}

async function getConversations(req, res) {
    const userId = req.params.id;
    try {
        const result = await pool.query('SELECT user_message, bot_response, created_at FROM conversations WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Erreur serveur' });
    }
}

async function getStats(req, res) {
    try {
        const totalUsers = await pool.query('SELECT COUNT(*) FROM users');
        const totalConversations = await pool.query('SELECT COUNT(*) FROM conversations');
        const todayMessages = await pool.query('SELECT COUNT(*) FROM conversations WHERE created_at::date = CURRENT_DATE'); res.json({
            totalUsers: totalUsers.rows[0].count,
            totalConversations: totalConversations.rows[0].count,
            todayMessages: todayMessages.rows[0].count
        });
    } catch (error) {
        res.status(500).json({ error: 'Erreur serveur' });
    }

}

async function getTopIntentions(req, res) {
    try {
        const result = await pool.query(`
            SELECT intention, COUNT(*) as count
            FROM conversations
            GROUP BY intention
            ORDER BY count DESC
            LIMIT 5
        `);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Erreur serveur' });
    }
}

async function deleteUser(req, res) {
    const userId = req.params.id;
    try {
        await pool.query('DELETE FROM users WHERE id = $1', [userId]);
        res.json({ message: 'Utilisateur supprimé avec succès' });
    } catch (error) {
        res.status(500).json({ error: 'Erreur serveur' });
    }
}

module.exports = {
    getAllUsers,
    getConversations,
    getStats,
    getTopIntentions,
    deleteUser
};