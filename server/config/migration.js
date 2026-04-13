const pool = require('./db');

async function migrate() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            firstname VARCHAR(255) NOT NULL,
            lastname VARCHAR(255) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT NOW()
            );
            CREATE TABLE IF NOT EXISTS conversations (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            created_at TIMESTAMP DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS messages (
            id SERIAL PRIMARY KEY,
            conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
            sender varchar(50) NOT NULL CHECK (sender IN ('user', 'bot')),
            content TEXT NOT NULL,
            intention VARCHAR(70),
            created_at TIMESTAMP DEFAULT NOW()
            );

            ALTER TABLE users ADD COLUMN IF NOT EXISTS refresh_token TEXT;
            ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user';
            ALTER TABLE conversations ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
            ALTER TABLE conversations ADD COLUMN last_activity TIMESTAMP DEFAULT NOW();
        `);
        console.log('Migration completed successfully');
    } catch (error) {
        console.error('Migration failed:', error);
    }
}

migrate();