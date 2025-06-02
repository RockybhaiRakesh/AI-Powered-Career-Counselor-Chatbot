// // test.ts
// import { Pool } from 'pg';

// const pool = new Pool({
//   user: 'postgres.ejwoymsrwrfhuszjzdkd', // ✅ Pooler பயனர் உங்கள் திட்ட ref ஐக் கொண்டிருக்கும்
//   host: 'aws-0-ap-south-1.pooler.supabase.com', // ✅ Pooler ஹோஸ்ட்
//   database: 'postgres',
//   password: 'Rocky@123', // உங்கள் உண்மையான Supabase கடவுச்சொல்
//   port: 6543, // ✅ போர்ட் 6543
//   ssl: { rejectUnauthorized: false }
// });

// (async () => {
//   try {
//     const res = await pool.query('SELECT NOW()');
//     console.log('✅ Connected to Supabase DB:', res.rows[0]);
//   } catch (err) {
//     console.error('❌ Failed to connect:', err);
//   } finally {
//     await pool.end();
//   }
// })();