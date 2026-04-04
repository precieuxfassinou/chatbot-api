const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');


async function register(req, res) {

    const { firstname, lastname, email, password } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await pool.query(
            'INSERT INTO users (firstname, lastname, email, password) VALUES ($1, $2, $3, $4) RETURNING id',
            [firstname, lastname, email, hashedPassword]
        );

        const userId = result.rows[0].id;
        const accessToken = jwt.sign(
            { id: userId },
            process.env.JWT_ACCESS_SECRET,
            { expiresIn: '15m' }
        );

        const refreshToken = jwt.sign(
            { id: userId },
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: '7d' }
        );

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.status(201).json({ accessToken });

    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ error: 'Email déjà utilisé' });
        }
        res.status(500).json({ error: 'Erreur serveur' });
    }
}

async function login(req, res) {
    const { email, password } = req.body;

    try {
        const result = await pool.query('SELECT id, password FROM users WHERE email = $1', [email]);

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
        }

        const user = result.rows[0];
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
        }

        const accessToken = jwt.sign(
            { id: user.id },
            process.env.JWT_ACCESS_SECRET,
            { expiresIn: '15m' }
        );
        const refreshToken = jwt.sign(
            { id: user.id },
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: '7d' }
        );
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            maxAge: 7 * 24 * 60 * 60 * 1000
        });
        res.status(200).json({ accessToken });

    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ error: 'Email ou mot de passe incorrect' });
        }
        res.status(500).json({ error: 'Erreur serveur' });
    }
}

async function getProfile(req, res) {
    const result = await pool.query(
        'SELECT id, firstname, lastname, email, role FROM users WHERE id = $1',
        [req.user.id]
    );
    res.json(result.rows[0]);
}

async function refreshToken(req, res) {
    const refreshToken = req.cookies.refreshToken;

    try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        const accessToken = jwt.sign(
            { id: decoded.id },
            process.env.JWT_ACCESS_SECRET,
            { expiresIn: '15m' }
        );
        res.status(200).json({ accessToken });
    } catch (error) {
        res.status(401).json({ error: 'Invalid refresh token' });
    }
}

async function logout(req, res) {
    res.clearCookie('refreshToken');
    res.status(200).json({ message: 'Déconnecté avec succès' });
}

module.exports = { register, login, refreshToken, logout, getProfile };