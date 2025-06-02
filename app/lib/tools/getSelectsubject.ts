import db from '../db'; // PostgreSQL database connection setup
import { model } from '../gemini'; // Gemini model initialization
import { log } from '@/app/lib/logger'; // Centralized logger

const getTimestamp = (): string => {
  const now = new Date();
  return now.toISOString().replace('T', ' ').split('.')[0];
};

/**
 * Fetches main subjects for a given 12th standard stream/group.
 * Checks DB first, otherwise queries Gemini LLM, stores results in DB, and returns them.
 *
 * @param group The name of the subject group (e.g., "Science with Biology").
 * @returns A Promise that resolves to an array of the names of the subjects.
 */
export const getSelectSubjects = async (group: string): Promise<string[]> => {
  log.info(`🚀 Starting subject fetch for group: "${group}"`, ['subject-fetch']);

  const client = await db.connect();

  try {
    log.info(`🔍 Looking for group ID in 'subject_groups' table...`, ['db']);
    const groupResult = await client.query(
      'SELECT id FROM subject_groups WHERE name = $1',
      [group]
    );
    const groupId = groupResult.rows?.[0]?.id;

    if (!groupId) {
      log.error(`❌ Group "${group}" not found in DB.`, ['db']);
    } else {
      log.info(`✅ Found group ID: ${groupId} for "${group}"`, ['db']);

      const existingSubjectsRes = await client.query(
        'SELECT name FROM subjects WHERE group_id = $1 ORDER BY name ASC',
        [groupId]
      );

      if (existingSubjectsRes.rows.length > 0) {
        const subjectsFromDB = existingSubjectsRes.rows.map(row => row.name);
        log.info(`📚 Subjects found in DB`, ['db'], { subjects: subjectsFromDB });
        log.info(`🏁 Returning DB subjects and skipping LLM.`, ['result']);
        return subjectsFromDB;
      } else {
        log.warn(`⚠️ No subjects found in DB for group "${group}".`, ['db']);
      }
    }

    log.info(`🧠 Calling Gemini LLM for subjects...`, ['llm']);
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
      log.error(`❌ Gemini model not initialized.`, ['llm']);
      return [];
    }

    const result = await model.generateContent(prompt);
    const subjectsFromLLM = result.response.text()
      .split('\n')
      .map(item => item.replace(/^\d+\.\s*/, '').trim())
      .filter(item => item.length > 0);

    log.info(`📤 Received ${subjectsFromLLM.length} subjects from Gemini`, ['llm'], {
      subjects: subjectsFromLLM,
    });

    if (groupId) {
      log.info(`💾 Inserting subjects into DB...`, ['db']);
      await client.query('BEGIN');

      for (const subject of subjectsFromLLM) {
        log.info(`➕ Inserting subject: "${subject}"`, ['db']);
        await client.query(
          'INSERT INTO subjects (name, group_id, category) VALUES ($1, $2, $3) ON CONFLICT (name) DO NOTHING',
          [subject, groupId, group]
        );
      }

      await client.query('COMMIT');
      log.info(`✅ Subjects successfully committed to DB.`, ['db']);
    } else {
      log.warn(`⚠️ Cannot save subjects. groupId not found.`, ['db']);
    }

    log.info(`🏁 Returning subjects from LLM.`, ['result']);
    return subjectsFromLLM;

  } catch (error) {
    await client.query('ROLLBACK');
    log.error(`❌ Error during subject fetch/save for group "${group}"`, ['error'], {
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  } finally {
    client.release();
    log.info(`🔚 Database client released.`, ['db']);
  }
};
