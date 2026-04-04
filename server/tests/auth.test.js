const request = require('supertest');
const app = require('../index');
const pool = require('../config/db');

beforeAll(async () => {
    await pool.query("DELETE FROM users WHERE email = 'test@test.com'");
});

afterAll(async () => {
    await pool.query("DELETE FROM users WHERE email = 'test@test.com'");
    await pool.end();
});

describe('Auth routes', () => {
    it('should register a new user', async () => {
        const response = await request(app)
            .post('/auth/register')
            .send({
                firstname: 'Test',
                lastname: 'User',
                email: 'test@test.com',
                password: 'password123'
            });
        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('accessToken');
    });
    it('should login an existing user', async () => {
        const response = await request(app)
            .post('/auth/login')
            .send({
                email: 'test@test.com',
                password: 'password123'
            });
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('accessToken');
    });
    it('should not login with wrong credentials', async () => {
        const response = await request(app)
            .post('/auth/login')
            .send({
                email: 'test@test.com',
                password: 'wrongpassword'
            });
        expect(response.status).toBe(401);
    });
    it('should not register with existing email', async () => {
        const response = await request(app)
            .post('/auth/register')
            .send({
                firstname: 'Test',
                lastname: 'User',
                email: 'test@test.com',
                password: 'password123'
            });
        expect(response.status).toBe(409);
    });
});