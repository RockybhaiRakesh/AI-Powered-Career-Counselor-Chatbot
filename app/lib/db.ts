// src/lib/db.ts
import { Pool } from 'pg';

const pool = new Pool({
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE, // This will now be 'postgres'
    password: process.env.PG_PASSWORD,
    port: Number(process.env.PG_PORT) || 5432,
    ssl: { rejectUnauthorized: false }
});

export default pool;