// src/lib/tools/getExamsByCollege.ts

import db from '../db';
import { model } from '../gemini';

// Helper function to get timestamp
const getTimestamp = (): string => {
  const now = new Date();
  return now.toISOString().replace('T', ' ').split('.')[0]; // Consistent format
};

/**
 * Fetches entrance exams required for admission to a specific college and course from the LLM,
 * and saves them into the 'exams' table, linking them to the college in 'college_exams'.
 *
 * @param college The name of the college.
 * @param course The name of the course.
 * @returns A Promise that resolves to an array of exam names.
 */
export const getExamsByCollege = async (college: string, course: string): Promise<string[]> => {
  if (!model) {
    console.error(`[${getTimestamp()}] ERROR: Gemini model is not initialized. Cannot fetch exams.`);
    return [];
  }

  const prompt = `
You are an expert on Indian college admissions.
List 3-5 major entrance exams (or competitive scores/criteria, not just cutoffs) required for admission to "${college}" for the undergraduate course "${course}".
**Strictly adhere to the following format:**
- Numbered list (e.g., 1. Exam Name).
- One exam per line.
- Do NOT include any introductory or concluding text.
- Do NOT include any additional details like cutoff values or descriptions in the list itself. Just the exam name.
`;

  const client = await db.connect(); // Get a client from the pool for transaction
  try {
    console.info(`[${getTimestamp()}] INFO: Generating exam data for college="${college}", course="${course}"`);

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    console.info(`[${getTimestamp()}] INFO: Raw response from Gemini for exams:\n${text}`);

    // Parse exams - remove numbering and trim
    const exams = text.split('\n')
                      .map(item => item.replace(/^\d+\.\s*/, '').trim())
                      .filter(item => item.length > 0);

    console.info(`[${getTimestamp()}] INFO: Parsed exams from Gemini:`, exams);

    const collegeRes = await client.query('SELECT id FROM colleges WHERE name = $1', [college]);
    const collegeId = collegeRes.rows?.[0]?.id;

    if (!collegeId) {
      console.warn(`[${getTimestamp()}] WARN: College '${college}' not found in DB. Cannot link exams. Returning exams without saving linkage.`);
      return exams; // Still return the exams fetched, even if not linked
    }

    await client.query('BEGIN'); // Start transaction

    for (const examName of exams) { // Use examName directly
      let examId: number | undefined;

      const insertExamRes = await client.query(
        'INSERT INTO exams (name) VALUES ($1) ON CONFLICT (name) DO NOTHING RETURNING id',
        [examName]
      );

      if (insertExamRes.rows.length > 0) {
        examId = insertExamRes.rows[0].id;
        console.info(`[${getTimestamp()}] INFO: Inserted new exam '${examName}' with ID ${examId}`);
      } else {
        const selectExamRes = await client.query('SELECT id FROM exams WHERE name = $1', [examName]);
        examId = selectExamRes.rows[0]?.id;
        console.info(`[${getTimestamp()}] INFO: Fetched existing exam '${examName}' with ID ${examId}`);
      }

      if (examId && collegeId) {
        await client.query(
          'INSERT INTO college_exams (college_id, exam_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [collegeId, examId]
        );
        console.info(`[${getTimestamp()}] INFO: Linked college ID ${collegeId} to exam ID ${examId} for '${examName}'`);
      } else {
        console.warn(`[${getTimestamp()}] WARN: Could not link college ${collegeId} to exam '${examName}' (examId: ${examId}). Missing IDs.`);
      }
    }
    await client.query('COMMIT'); // Commit transaction

    return exams;
  } catch (error) {
    await client.query('ROLLBACK'); // Rollback on error
    console.error(`[${getTimestamp()}] ERROR: Error fetching exams:`, error);
    return [];
  } finally {
    client.release(); // Release client
  }
};