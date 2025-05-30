// src/lib/tools/getSelectSubjects.ts

import db from '../db'; // PostgreSQL database connection setup
import { model } from '../gemini'; // Gemini model initialization

// Helper to get current timestamp in 'YYYY-MM-DD HH:MM:SS' format
const getTimestamp = () => {
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
  try {
    console.info(`[${getTimestamp()}] 🔍 Checking for existing subjects for group "${group}" in the database...`);

    // First, get the ID for the given group from the 'subject_groups' table
    const groupResult = await db.query('SELECT id FROM subject_groups WHERE name = $1', [group]);
    const groupId = groupResult.rows?.[0]?.id;

    if (!groupId) {
      // If the group itself is not found in the DB, we cannot proceed to check subjects for it.
      // This implies getSubjectGroups hasn't run or completed for this group.
      console.error(`[${getTimestamp()}] ❌ Subject group "${group}" not found in the database. Cannot check/add subjects.`);
      // We still proceed to LLM call in case the group was just created and not yet linked.
      // However, if the main group isn't in DB, the subject won't be linked correctly.
      // A more robust solution might involve ensuring getSubjectGroups runs successfully first.
    } else {
      // If groupId is found, check for existing subjects linked to this groupId
      const existingSubjectsRes = await db.query(
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

    const prompt = `List the main subjects typically studied in the "${group}" stream in Indian 12th standard education.
Provide only the subjects as a numbered list, one per line, without any additional text.`;

    if (!model) {
      console.error(`[${getTimestamp()}] ❌ Gemini model is not initialized. Cannot fetch subjects from LLM.`);
      return [];
    }

    const result = await model.generateContent(prompt);
    const subjectsFromLLM = result.response.text()
      .split('\n')
      .map(item => item.replace(/^\d+\.\s*/, '').trim())
      .filter(item => item.length > 0);

    console.info(`[${getTimestamp()}] 🧠 Subjects received from Gemini for "${group}":`, subjectsFromLLM);

    // If groupId was found, save the LLM-generated subjects to the database
    if (groupId) {
      console.info(`[${getTimestamp()}] 💾 Saving LLM-generated subjects for "${group}" to DB...`);
      for (const subject of subjectsFromLLM) {
        await db.query(
          'INSERT INTO subjects (name, group_id, category) VALUES ($1, $2, $3) ON CONFLICT (name) DO NOTHING',
          [subject, groupId, group] // Use group name as the category
        );
        console.info(`[${getTimestamp()}] 📥 Successfully inserted/ensured: ${subject}`);
      }
      console.info(`[${getTimestamp()}] ✅ All LLM-generated subjects for "${group}" saved successfully.`);
    } else {
      console.warn(`[${getTimestamp()}] ⚠️ Could not save subjects for "${group}" to DB as groupId was not found.`);
    }

    return subjectsFromLLM;

  } catch (error) {
    console.error(`[${getTimestamp()}] ❌ Error fetching or saving subjects for group "${group}":`, error);
    return [];
  }
};