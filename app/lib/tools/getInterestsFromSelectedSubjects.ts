import db from '../db';
import { model } from '../gemini';
import { log } from '@/app/lib/logger'; // Centralized logger

const getTimestamp = (): string => {
  const now = new Date();
  return now.toISOString().replace('T', ' ').split('.')[0];
};

export const getInterestsFromSelectedSubjects = async (
  selectedSubjects: string[]
): Promise<string[]> => {
  if (!model) {
    log.warn(`[${getTimestamp()}] ⚠️ Gemini model not initialized. Returning empty interests.`, ['llm']);
    return [];
  }

  if (selectedSubjects.length === 0) {
    log.warn(`[${getTimestamp()}] ⚠️ No subjects provided. Returning empty interests.`, ['input']);
    return [];
  }

  log.info(`[${getTimestamp()}] 🎯 Starting interest generation for selected subjects.`, ['input'], {
    subjects: selectedSubjects,
  });

  let mainCategoryForInterests: string | null = null;
  const client = await db.connect();

  try {
    const firstSubjectName = selectedSubjects[0];
    log.info(`[${getTimestamp()}] 🔍 Retrieving category for subject '${firstSubjectName}'...`, ['db']);

    const subjectCategoryRes = await client.query(
      'SELECT category FROM subjects WHERE name = $1 LIMIT 1',
      [firstSubjectName]
    );

    if (subjectCategoryRes.rows.length > 0) {
      mainCategoryForInterests = subjectCategoryRes.rows[0].category;
      log.info(`[${getTimestamp()}] ✅ Category found: '${mainCategoryForInterests}'`, ['db']);
    } else {
      log.warn(`[${getTimestamp()}] ⚠️ No category found for subject '${firstSubjectName}'`, ['db']);
    }

    const subjectsList = selectedSubjects.join(', ');
    const prompt = `
You are an expert career counselor.
Given the 12th standard subjects: **${subjectsList}**, generate a comprehensive list of highly relevant career-related interests.
**Strictly adhere to the following format:**
- Provide the interests as a bulleted list.
- One interest per line.
- Each line must be prefixed with a hyphen and a space (e.g., - Software Development).
- Do NOT include any introductory remarks (e.g., "Here are some interests:").
- Do NOT include any concluding remarks.
- Do NOT include numbering or any other formatting besides the hyphen.
- Focus on distinct and actionable interests.
`;

    log.info(`[${getTimestamp()}] 📤 Sending prompt to Gemini model...`, ['llm']);
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    log.info(`[${getTimestamp()}] 📥 Gemini response received.`, ['llm']);

    const interests = text
      .split('\n')
      .map(line => line.replace(/^[-\*\d\.]*\s*/, '').trim())
      .filter(item => item.length > 0);

    const uniqueInterests = Array.from(new Set(interests));
    log.info(`[${getTimestamp()}] 📊 Parsed ${uniqueInterests.length} unique interests.`, ['parse'], {
      interests: uniqueInterests,
    });

    log.info(`[${getTimestamp()}] 🔄 Starting DB transaction for interest linking...`, ['db']);
    await client.query('BEGIN');

    for (const interest of uniqueInterests) {
      log.info(`[${getTimestamp()}] ➕ Inserting interest: '${interest}'`, ['db']);
      const insertRes = await client.query(
        'INSERT INTO interests (name, category) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING RETURNING id',
        [interest, mainCategoryForInterests]
      );

      if (insertRes.rows.length > 0) {
        const interestId = insertRes.rows[0].id;
        log.info(`[${getTimestamp()}] ✅ Interest inserted with ID: ${interestId}`, ['db']);
      } else {
        log.info(`[${getTimestamp()}] ℹ️ Interest '${interest}' already exists in DB.`, ['db']);
      }
    }

    await client.query('COMMIT');
    log.info(`[${getTimestamp()}] ✅ All interests committed to DB.`, ['db']);

    return uniqueInterests;

  } catch (error) {
    await client.query('ROLLBACK');
    log.error(`[${getTimestamp()}] ❌ Error during interest generation process.`, ['error'], {
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  } finally {
    client.release();
    log.info(`[${getTimestamp()}] 🔚 Database connection released.`, ['db']);
  }
};
