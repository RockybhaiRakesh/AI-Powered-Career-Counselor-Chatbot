import { Pool } from 'pg';

const pool = new Pool({
  user: 'postgres',
  host: 'aws-0-ap-southeast-1.pooler.supabase.com',  // ✅ Use transaction pooler host
  database: 'postgres',
  password: 'Rocky@123',
  port: 6543,                                         // ✅ Note: port is 6543 not 5432
  ssl: { rejectUnauthorized: false }
});

(async () => {
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('✅ Connected to Supabase DB:', res.rows[0]);
  } catch (err) {
    console.error('❌ Failed to connect:', err);
  } finally {
    await pool.end();
  }
})();
