// src/lib/tools/getSelectSubjects.ts

import db from '../db'; // PostgreSQL database connection setup
import { model } from '../gemini'; // Gemini model initialization

// Helper to get current timestamp in 'YYYY-MM-DD HH:MM:SS' format
const getTimestamp = (): string => {
  const now = new Date();
  return now.toISOString().replace('T', ' ').split('.')[0];
};

/**
 * Fetches main subjects for a given 12th standard stream/group.
 * It first checks if these subjects already exist in the 'subjects' table in the database
 * for the specified group. If they exist, it retrieves them from the DB.
 * If not, it calls the LLM to get the subjects, saves them to the DB, and then returns them.
 *
 * @param group The name of the subject group (e.g., "Science with Biology").
 * @returns A Promise that resolves to an array of the names of the subjects.
 */
export const getSelectSubjects = async (group: string): Promise<string[]> => {
  const client = await db.connect(); // Get a client from the pool for transaction
  try {
    console.info(`[${getTimestamp()}] 🔍 Checking for existing subjects for group "${group}" in the database...`);

    // First, get the ID for the given group from the 'subject_groups' table
    const groupResult = await client.query('SELECT id FROM subject_groups WHERE name = $1', [group]);
    const groupId = groupResult.rows?.[0]?.id;

    if (!groupId) {
      console.error(`[${getTimestamp()}] ❌ Subject group "${group}" not found in the database. Ensure 'getSubjectGroups' has run successfully for this group.`);
      // If the group itself is not found, we cannot link subjects to it.
      // We will still attempt to get subjects from LLM, but won't save them linked.
      // The assumption is that `getSubjectGroups` is called first to populate groups.
    } else {
      // If groupId is found, check for existing subjects linked to this groupId
      const existingSubjectsRes = await client.query(
        'SELECT name FROM subjects WHERE group_id = $1 ORDER BY name ASC',
        [groupId]
      );

      if (existingSubjectsRes.rows.length > 0) {
        // If subjects exist for this group in the DB, retrieve and return them
        const subjectsFromDB = existingSubjectsRes.rows.map(row => row.name);
        console.info(`[${getTimestamp()}] ✅ Found existing subjects for "${group}" in DB. Retrieving:`, subjectsFromDB);
        return subjectsFromDB;
      }
    }

    // If no subjects found in DB for this group (or group not found initially), proceed to call the LLM
    console.info(`[${getTimestamp()}] 🚫 No subjects found in DB for "${group}". Calling Gemini LLM...`);

    const prompt = `
You are an expert on the Indian education system.
List the **main academic subjects** typically studied in the "${group}" stream for the Indian 12th standard education.
**Strictly adhere to the following format:**
- Provide only the subjects.
- One subject per line.
- No numbering.
- No introductory or concluding text.

Example (for "Science with Biology"):
Physics
Chemistry
Biology
English
Physical Education
`;

    if (!model) {
      console.error(`[${getTimestamp()}] ❌ Gemini model is not initialized. Cannot fetch subjects from LLM.`);
      return [];
    }

    const result = await model.generateContent(prompt);
    const subjectsFromLLM = result.response.text()
      .split('\n')
      .map(item => item.replace(/^\d+\.\s*/, '').trim()) // Remove potential numbering if LLM deviates
      .filter(item => item.length > 0);

    console.info(`[${getTimestamp()}] 🧠 Subjects received from Gemini for "${group}":`, subjectsFromLLM);

    // If groupId was found, save the LLM-generated subjects to the database within a transaction
    if (groupId) {
      console.info(`[${getTimestamp()}] 💾 Saving LLM-generated subjects for "${group}" to DB within a transaction...`);
      await client.query('BEGIN'); // Start transaction
      for (const subject of subjectsFromLLM) {
        await client.query( // Use client for queries within transaction
          'INSERT INTO subjects (name, group_id, category) VALUES ($1, $2, $3) ON CONFLICT (name) DO NOTHING',
          [subject, groupId, group] // Use group name as the category for consistency
        );
        console.info(`[${getTimestamp()}] 📥 Successfully inserted/ensured: ${subject}`);
      }
      await client.query('COMMIT'); // Commit transaction
      console.info(`[${getTimestamp()}] ✅ All LLM-generated subjects for "${group}" saved successfully.`);
    } else {
      console.warn(`[${getTimestamp()}] ⚠️ Could not save subjects for "${group}" to DB as groupId was not found. Subjects:`, subjectsFromLLM);
    }

    return subjectsFromLLM;

  } catch (error) {
    await client.query('ROLLBACK'); // Rollback on error if transaction was started
    console.error(`[${getTimestamp()}] ❌ Error fetching or saving subjects for group "${group}":`, error);
    return [];
  } finally {
    client.release(); // Release the client back to the pool
  }
};