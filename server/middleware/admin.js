const pool = require('../config/db');

const isAdmin = async (req, res, next) => {

    const result = await pool.query('SELECT role FROM users WHERE id = $1', [req.user.id]);
    if (result.rows.length === 0 || result.rows[0].role !== 'admin') {
        return res.status(403).json({ error: 'Access denied. Admins only.' });
    } else {
        next();
    }
};

module.exports = isAdmin;