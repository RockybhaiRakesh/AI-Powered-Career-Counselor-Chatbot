import db from '../db';
import { model } from '../gemini';
import { log } from '@/app/lib/logger';

const getTimestamp = (): string => {
  return new Date().toISOString().replace('T', ' ').split('.')[0];
};

async function fetchSubjectsFromDB(client: any, groupId: number): Promise<string[]> {
  const res = await client.query(
    'SELECT name FROM subjects WHERE group_id = $1 ORDER BY name ASC',
    [groupId]
  );
  return res.rows.map((r: any) => r.name);
}

export const getSelectSubjects = async (group: string): Promise<string[]> => {
  log.info(`🚀 Starting subject fetch for group: "${group}"`, ['subject-fetch']);
  const client = await db.connect();

  try {
    const groupResult = await client.query(
      'SELECT id FROM subject_groups WHERE name = $1',
      [group]
    );
    const groupId = groupResult.rows?.[0]?.id;

    if (!groupId) {
      log.error(`❌ Group "${group}" not found in DB.`, ['db']);
      return [];
    }
    log.info(`✅ Found group ID: ${groupId} for "${group}"`, ['db']);

    // Try fetching existing subjects first
    const existingSubjects = await fetchSubjectsFromDB(client, groupId);
    if (existingSubjects.length > 0) {
      log.info(`📚 Subjects found in DB`, ['db'], { subjects: existingSubjects });
      return existingSubjects;
    }
    log.warn(`⚠️ No subjects found in DB for group "${group}". Fetching from LLM...`, ['db']);

    if (!model) {
      log.error(`❌ Gemini model not initialized.`, ['llm']);
      return [];
    }

    const prompt = `
You are an expert on the Indian education system.
List the **main academic subjects** typically studied in the "${group}" stream for the Indian 12th standard education.
**Strictly adhere to the following format:**
- Provide only the subjects.
- One subject per line.
- No numbering.
- No introductory or concluding text.
`;

    const result = await model.generateContent(prompt);
    const subjectsFromLLM = result.response.text()
      .split('\n')
      .map(item => item.trim())
      .filter(item => item.length > 0);

    log.info(`📤 Received ${subjectsFromLLM.length} subjects from Gemini`, ['llm'], { subjects: subjectsFromLLM });

    // Insert subjects into DB within a transaction
    await client.query('BEGIN');
    for (const subject of subjectsFromLLM) {
      await client.query(
        'INSERT INTO subjects (name, group_id, category) VALUES ($1, $2, $3) ON CONFLICT (name) DO NOTHING',
        [subject, groupId, group]
      );
      log.info(`➕ Inserted subject: "${subject}"`, ['db']);
    }
    await client.query('COMMIT');
    log.info(`✅ Subjects successfully committed to DB.`, ['db']);

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
