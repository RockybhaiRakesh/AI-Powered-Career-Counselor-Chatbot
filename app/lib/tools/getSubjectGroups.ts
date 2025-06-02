import { model } from '../gemini'; // Initialized Gemini model
import db from '../db'; // PostgreSQL connection
import { log } from '@/app/lib/logger'; // Centralized logger

const getTimestamp = (): string => {
  const now = new Date();
  return now.toISOString().replace('T', ' ').split('.')[0];
};

export const getSubjectGroups = async (): Promise<string[]> => {
  const client = await db.connect();
  try {
    log.info(`[${getTimestamp()}] 🔍 Checking for existing subject groups in the database...`);
    const existingGroupsRes = await client.query('SELECT name FROM subject_groups ORDER BY name ASC');

    if (existingGroupsRes.rows.length > 0) {
      const groupsFromDB = existingGroupsRes.rows.map(row => row.name);
      log.info(`[${getTimestamp()}] ✅ Found subject groups in DB:`, groupsFromDB);
      return groupsFromDB;
    }

    log.warn(`[${getTimestamp()}] ⚠️ No subject groups found in DB. Requesting from Gemini LLM...`);

    const prompt = `
You are an expert on the Indian education system.
List the **6 (SIX)** most common 12th standard academic streams/groups in the Indian curriculum, including their standard variations.
**Strictly adhere to the following format:**
- Newline-separated.
- No numbering.
- No introductory text (e.g., "Here are the streams:").
- No concluding text (e.g., "These are the main streams.").
- Provide only the stream names.

**Examples of expected format (strictly these types, one per line):**
Science with Biology
Science with Computer Science
Commerce with Mathematics
Commerce without Mathematics
Humanities
Vocational Stream
`;

    if (!model) {
      log.error(`[${getTimestamp()}] ❌ Gemini model is not initialized. Cannot fetch data.`);
      return [];
    }

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    const groupsFromLLM = text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .slice(0, 6);

    log.info(`[${getTimestamp()}] 🧠 Gemini LLM returned subject groups:`, groupsFromLLM);

    log.info(`[${getTimestamp()}] 💾 Saving new groups to the database (transaction)...`);
    await client.query('BEGIN');
    for (const group of groupsFromLLM) {
      await client.query(
        'INSERT INTO subject_groups (name) VALUES ($1) ON CONFLICT (name) DO NOTHING',
        [group]
      );
      log.info(`[${getTimestamp()}] 📥 Inserted/Ensured subject group: ${group}`);
    }
    await client.query('COMMIT');
    log.info(`[${getTimestamp()}] ✅ All groups saved successfully.`);
    return groupsFromLLM;

  } catch (error) {
    await client.query('ROLLBACK');
    log.error(`[${getTimestamp()}] ❌ Error during subject group handling:`, [], {
  error: error instanceof Error ? error.message : String(error),
});
    return [];
  } finally {
    client.release();
    log.info(`[${getTimestamp()}] 🔚 DB connection released.`);
  }
};
