require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const path = require("path");
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});


pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
});

module.exports = pool;