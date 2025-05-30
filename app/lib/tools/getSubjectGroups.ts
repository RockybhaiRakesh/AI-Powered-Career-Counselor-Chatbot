// src/lib/tools/getSubjectGroups.ts

import { model } from '../gemini'; // Assuming this imports your initialized Gemini model
import db from '../db'; // Assuming this is your PostgreSQL database connection setup

// Helper to get timestamp in 'YYYY-MM-DD HH:MM:SS' format
const getTimestamp = () => {
  const now = new Date();
  return now.toISOString().replace('T', ' ').split('.')[0];
};

/**
 * Fetches common 12th standard academic streams.
 * It first checks if the data exists in the 'subject_groups' table in the database.
 * If data exists, it retrieves it from the DB.
 * If the table is empty, it calls the LLM to get the streams and then saves them to the DB.
 *
 * @returns A Promise that resolves to an array of the names of the subject groups.
 */
export const getSubjectGroups = async (): Promise<string[]> => {
  try {
    // 1. Check if subject groups already exist in the database
    console.info(`[${getTimestamp()}] 🔍 Checking for existing subject groups in the database...`);
    const existingGroupsRes = await db.query('SELECT name FROM subject_groups ORDER BY name ASC');

    if (existingGroupsRes.rows.length > 0) {
      // If groups exist, retrieve them from the database
      const groupsFromDB = existingGroupsRes.rows.map(row => row.name);
      console.info(`[${getTimestamp()}] ✅ Found existing subject groups in DB. Retrieving:`, groupsFromDB);
      return groupsFromDB;
    }

    // 2. If no groups found in DB, proceed to call the LLM
    console.info(`[${getTimestamp()}] 🚫 No subject groups found in DB. Calling Gemini LLM...`);

    const prompt = `
List the 6 most common 12th standard academic streams/groups in the Indian curriculum, including their standard variations.
Format: Newline-separated, no numbering, no introductory/concluding text.

Expected examples (strictly these types):
Science with Biology
Science with Computer Science
Commerce with Mathematics
Commerce without Mathematics
Humanities / Arts
Vocational Stream
`;

    if (!model) {
      console.error(`[${getTimestamp()}] ❌ Gemini model is not initialized. Cannot fetch from LLM.`);
      return [];
    }

    const result = await model.generateContent(prompt);
    const text = await result.response.text();

    const groupsFromLLM = text
      .split('\n')
      .map(item => item.trim())
      .filter(item => item.length > 0)
      .slice(0, 6); // Limit to expected number of groups

    console.info(`[${getTimestamp()}] 🧠 Gemini responded with subject groups:`, groupsFromLLM);

    // 3. Save the LLM-generated groups to the database
    console.info(`[${getTimestamp()}] 💾 Saving LLM-generated groups to DB...`);
    for (const group of groupsFromLLM) {
      await db.query(
        'INSERT INTO subject_groups (name) VALUES ($1) ON CONFLICT (name) DO NOTHING',
        [group]
      );
      console.info(`[${getTimestamp()}] 📥 Successfully inserted/ensured: ${group}`);
    }

    console.info(`[${getTimestamp()}] ✅ All LLM-generated subject groups saved successfully.`);
    return groupsFromLLM;

  } catch (error) {
    console.error(`[${getTimestamp()}] ❌ Error during subject group fetching/saving:`, error);
    return [];
  }
};