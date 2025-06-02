import db from '../db';
import { model } from '../gemini';
import { log } from '@/app/lib/logger';

// Helper function to get timestamp
const getTimestamp = (): string => {
  const now = new Date();
  return now.toISOString().replace('T', ' ').split('.')[0]; // Consistent format
};

/**
 * Fetches the typical cutoff for a given exam at a specific college and course from the LLM,
 * and saves it into the 'cutoffs' table in the database.
 *
 * @param exam The name of the exam.
 * @param college The name of the college.
 * @param course The name of the course (REQUIRED for specific cutoff).
 * @returns A Promise that resolves to the cutoff text.
 */
export const getCutoffForExam = async (exam: string, college: string, course: string): Promise<string> => {
  if (!model) {
    console.error(`[${getTimestamp()}] ERROR: Gemini model is not initialized. Cannot fetch cutoff.`);
    return "Error: Model not initialized.";
  }

  const prompt = `
You are an expert on Indian college admissions cutoffs.
What is the **typical cutoff or percentage required** in the "${exam}" exam for admission into "${college}" for the undergraduate course "${course}" in India?
Provide a clear, concise answer, focusing ONLY on the cutoff value/range or specific criteria.
**Do NOT include any introductory phrases like "The cutoff is..." or conversational filler.**
**If precise data is unavailable, provide a general range or relevant qualitative information, but keep it concise.**
`;

  const client = await db.connect(); // Get a client from the pool for transaction
  try {
    console.info(`[${getTimestamp()}] INFO: Fetching cutoff for exam="${exam}", college="${college}", course="${course}"`);

    const result = await model.generateContent(prompt);
    const cutoffValue = result.response.text().trim();

    console.info(`[${getTimestamp()}] INFO: Cutoff received from Gemini: "${cutoffValue}"`);

    // Get IDs for linking in the cutoffs table
    const examRes = await client.query('SELECT id FROM exams WHERE name = $1', [exam]);
    const examId = examRes.rows?.[0]?.id;

    const collegeRes = await client.query('SELECT id FROM colleges WHERE name = $1', [college]);
    const collegeId = collegeRes.rows?.[0]?.id;

    const courseRes = await client.query('SELECT id FROM courses WHERE name = $1', [course]);
    const courseId = courseRes.rows?.[0]?.id;

    if (!examId) console.warn(`[${getTimestamp()}] WARN: Exam '${exam}' not found in DB. Cannot save cutoff. Result: ${cutoffValue}`);
    if (!collegeId) console.warn(`[${getTimestamp()}] WARN: College '${college}' not found in DB. Cannot save cutoff. Result: ${cutoffValue}`);
    if (!courseId) console.warn(`[${getTimestamp()}] WARN: Course '${course}' not found in DB. Cannot save cutoff. Result: ${cutoffValue}`);

    if (examId && collegeId && courseId) {
      await client.query('BEGIN'); // Start transaction
      await client.query(
        'INSERT INTO cutoffs (exam_id, college_id, course_id, value) VALUES ($1, $2, $3, $4) ON CONFLICT (exam_id, college_id, course_id) DO UPDATE SET value = $4',
        [examId, collegeId, courseId, cutoffValue]
      );
      await client.query('COMMIT'); // Commit transaction
      console.info(`[${getTimestamp()}] INFO: Cutoff saved/updated in DB for examId=${examId}, collegeId=${collegeId}, courseId=${courseId}`);
    } else {
      console.warn(`[${getTimestamp()}] WARN: Insufficient IDs to save cutoff for exam='${exam}', college='${college}', course='${course}'.`);
    }

    return cutoffValue;
  } catch (error) {
    await client.query('ROLLBACK'); // Rollback on error
    console.error(`[${getTimestamp()}] ERROR: Error fetching cutoff:`, error);
    return "Error fetching cutoff.";
  } finally {
    client.release(); // Release client
  }
};
