// src/lib/db.ts
import { Pool } from 'pg';

// Temporary debug logs
console.log('DB_DEBUG: PG_USER:', process.env.PG_USER ? 'SET' : 'NOT SET');
console.log('DB_DEBUG: PG_HOST:', process.env.PG_HOST); // Log the actual value
console.log('DB_DEBUG: PG_DATABASE:', process.env.PG_DATABASE); // Log the actual value
console.log('DB_DEBUG: PG_PORT:', process.env.PG_PORT); // Log the actual value
console.log('DB_DEBUG: PG_PASSWORD:', process.env.PG_PASSWORD ? 'SET' : 'NOT SET');

const pool = new Pool({
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    password: process.env.PG_PASSWORD,
    port: Number(process.env.PG_PORT) || 5432,
});

export default pool;