// src/lib/tools/getCoursesByInterest.ts

import db from '../db';
import { model } from '../gemini';
import { log } from '@/app/lib/logger';

// Helper function to get timestamp
const getTimestamp = (): string => {
  const now = new Date();
  return now.toISOString().replace('T', ' ').split('.')[0]; // Consistent format
};

/**
 * Fetches relevant undergraduate courses from the LLM based on student interests and academic group,
 * and saves them into the 'courses' table in the database.
 *
 * @param interest An array of strings representing student interests.
 * @param group The academic group (e.g., "Science with Computer Science").
 * @returns A Promise that resolves to an array of relevant course names.
 */
export const getCoursesByInterest = async (
  interest: string[],
  group: string
): Promise<string[]> => {
  const timestamp = getTimestamp();
  console.info(`[${timestamp}] INFO: Started fetching UG courses for interests=[${interest.join(', ')}], group="${group}"`);
  log.info(`[${timestamp}] Started fetching UG courses for interests=[${interest.join(', ')}], group="${group}"`);

  if (!model) {
    const errorMsg = `[${timestamp}] ERROR: Gemini model is not initialized. Cannot fetch UG courses.`;
    console.error(errorMsg);
    log.error(errorMsg);
    return [];
  }

  if (interest.length === 0) {
    const warnMsg = `[${timestamp}] WARN: No interests provided for course generation. Returning empty array.`;
    console.warn(warnMsg);
    log.warn(warnMsg);
    return [];
  }

  const interestsList = interest.join(', ');
  const prompt = `
You are an AI career counselor specializing in Indian higher education.
Based on a student's interests: **${interestsList}** and academic background: "${group}",
list **only officially recognized and commonly offered Undergraduate (UG) degree programs** in India that directly and strongly align with these inputs.

**Strictly adhere to the following rules:**
- Include UG programs such as B.Sc, B.Tech, B.Com, B.A, B.Ed, BBA, BCA, MBBS, B.Arch, etc.
- Focus strictly on programs where the listed interests and academic group are a clear and direct foundation.
- **Do NOT invent programs or list those not genuinely available as UG degrees in India.**
- **Do NOT include any introductory or concluding remarks.**
- **Format as a numbered list (e.g., 1. B.Sc in Physics).**
- **Provide ONLY the degree names**, no explanations, descriptions, or additional text.
- Ensure the list is relevant and accurate based on common Indian university offerings.
`;

  const client = await db.connect();
  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    console.info(`[${timestamp}] INFO: Received courses list from Gemini:\n${text}`);
    log.info(`[${timestamp}] Received courses list from Gemini:\n${text}`);

    const courses = text.split('\n')
      .map((item) => item.replace(/^\d+\.\s*/, '').trim())
      .filter((item) => item.length > 0);

    // Get the group_id for linking courses
    let groupId: number | null = null;
    let groupCategory: string = group;

    try {
      const groupResult = await client.query('SELECT id FROM subject_groups WHERE name = $1', [group]);
      groupId = groupResult.rows?.[0]?.id || null;
      if (!groupId) {
        const warnMsg = `[${timestamp}] WARN: Subject group "${group}" not found for courses. Courses will be saved without a group_id.`;
        console.warn(warnMsg);
        log.warn(warnMsg);
      }
    } catch (dbError) {
      const errorMsg = `[${timestamp}] ERROR: Error fetching group ID for "${group}": ${dbError}`;
      console.error(errorMsg);
      log.error(errorMsg);
    }

    await client.query('BEGIN');

    for (const course of courses) {
      await client.query(
        'INSERT INTO courses (name, group_id, category) VALUES ($1, $2, $3) ON CONFLICT (name) DO NOTHING',
        [course, groupId, groupCategory]
      );
      const msg = `[${timestamp}] INFO: Saved course "${course}" with group_id=${groupId}, category="${groupCategory}"`;
      console.info(msg);
      log.info(msg);
    }

    await client.query('COMMIT');

    const successMsg = `[${timestamp}] INFO: Completed saving courses. Total courses saved/fetched: ${courses.length}`;
    console.info(successMsg);
    log.info(successMsg);

    return courses;
  } catch (error) {
    await client.query('ROLLBACK');
    const errorMsg = `[${timestamp}] ERROR: Error fetching UG courses: ${error}`;
    console.error(errorMsg);
    log.error(errorMsg);
    return [];
  } finally {
    client.release();
  }
};
