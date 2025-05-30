// src/lib/tools/getExamsByCollege.ts

import db from '../db';
import { model } from '../gemini';

// Helper function to get timestamp
const getTimestamp = () => {
  const now = new Date();
  return now.toISOString().split('T')[0] + ' ' + now.toTimeString().split(' ')[0];
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
  const prompt = `What are 3-5 entrance exams or cutoffs required for admission to "${college}" for the course "${course}"? Format each as a numbered list item.`;

  try {
    console.log(`[${getTimestamp()}] INFO: Generating exam data for college="${college}", course="${course}"`);

    if (!model) {
      console.error(`[${getTimestamp()}] ERROR: Gemini model is not initialized. Cannot fetch exams.`);
      return [];
    }

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    const exams = text.match(/^\d+\.\s(.*)/gm)?.map(item => item.replace(/^\d+\.\s/, '').trim()) || [];
    console.log(`[${getTimestamp()}] INFO: Exams received from Gemini:`, exams);

    const collegeRes = await db.query('SELECT id FROM colleges WHERE name = $1', [college]);
    const collegeId = collegeRes.rows?.[0]?.id;

    if (!collegeId) {
      console.warn(`[${getTimestamp()}] WARN: College '${college}' not found in DB. Cannot link exams.`);
      return exams;
    }

    for (const examFullText of exams) {
      const examNameMatch = examFullText.match(/^(.*?)\s*\(.*?\)$/);
      const examName = examNameMatch ? examNameMatch[1].trim() : examFullText.trim();

      let examId: number | undefined;

      const insertExamRes = await db.query(
        'INSERT INTO exams (name) VALUES ($1) ON CONFLICT (name) DO NOTHING RETURNING id',
        [examName]
      );

      if (insertExamRes.rows.length > 0) {
        examId = insertExamRes.rows[0].id;
        console.log(`[${getTimestamp()}] INFO: Inserted new exam '${examName}' with ID ${examId}`);
      } else {
        const selectExamRes = await db.query('SELECT id FROM exams WHERE name = $1', [examName]);
        examId = selectExamRes.rows[0]?.id;
        console.log(`[${getTimestamp()}] INFO: Fetched existing exam '${examName}' with ID ${examId}`);
      }

      if (examId && collegeId) {
        await db.query(
          'INSERT INTO college_exams (college_id, exam_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [collegeId, examId]
        );
        console.log(`[${getTimestamp()}] INFO: Linked college ID ${collegeId} to exam ID ${examId}`);
      } else {
        console.warn(`[${getTimestamp()}] WARN: Could not link college ${collegeId} to exam '${examName}' (examId: ${examId})`);
      }
    }

    return exams;
  } catch (error) {
    console.error(`[${getTimestamp()}] ERROR: Error fetching exams:`, error);
    return [];
  }
};
