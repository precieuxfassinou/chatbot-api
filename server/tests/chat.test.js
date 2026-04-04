const request = require('supertest');
const app = require('../index');
const pool = require('../config/db');

let token;

beforeAll(async () => {
    // Créer l'utilisateur de test
    await request(app)
        .post('/auth/register')
        .send({ firstname: 'Test', lastname: 'User', email: 'chattest@test.com', password: 'password123' });
    
    // Se connecter
    const res = await request(app)
        .post('/auth/login')
        .send({ email: 'chattest@test.com', password: 'password123' });
    token = res.body.accessToken;
});

afterAll(async () => {
    await pool.query("DELETE FROM conversations WHERE user_id = (SELECT id FROM users WHERE email = 'chattest@test.com')");
    await pool.query("DELETE FROM users WHERE email = 'chattest@test.com'");
    await pool.end();
});

describe('Chat API', () => {
    it('should send a message and get a response', async () => {
        const response = await request(app)
            .post('/chat')
            .set('Authorization', `Bearer ${token}`)
            .send({ message: 'Hello' })
            .expect(200);


        expect(response.body).toHaveProperty('response');
    });

    it('should handle empty messages', async () => {
        const response = await request(app)
            .post('/chat')
            .set('Authorization', `Bearer ${token}`)
            .send({ message: '' })
            .expect(400);
    });

    it('should return chat history', async () => {
        const response = await request(app)
            .get('/chat/history')
            .set('Authorization', `Bearer ${token}`)
            .expect(200);

        expect(Array.isArray(response.body.history)).toBe(true);
    });
});