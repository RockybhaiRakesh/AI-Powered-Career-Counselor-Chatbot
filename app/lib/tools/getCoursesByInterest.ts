// src/lib/tools/getCoursesByInterest.ts

import db from '../db';
import { model } from '../gemini';

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
  interest: string[], // Expects an array of strings
  group: string
): Promise<string[]> => {
  console.info(`[${getTimestamp()}] INFO: Started fetching UG courses for interests=[${interest.join(', ')}], group="${group}"`);

  if (!model) {
    console.error(`[${getTimestamp()}] ERROR: Gemini model is not initialized. Cannot fetch UG courses.`);
    return [];
  }

  if (interest.length === 0) {
    console.warn(`[${getTimestamp()}] WARN: No interests provided for course generation. Returning empty array.`);
    return [];
  }

  const interestsList = interest.join(', '); // Join for the prompt

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

  const client = await db.connect(); // Get a client from the pool for transaction
  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    console.info(`[${getTimestamp()}] INFO: Received courses list from Gemini:\n${text}`);

    const courses = text.split('\n')
      .map((item) => item.replace(/^\d+\.\s*/, '').trim()) // Clean up numbering
      .filter((item) => item.length > 0);

    // Get the group_id for linking courses
    let groupId: number | null = null;
    let groupCategory: string = group; // Use group name as category for courses too
    try {
      const groupResult = await client.query('SELECT id FROM subject_groups WHERE name = $1', [group]);
      groupId = groupResult.rows?.[0]?.id || null;
      if (!groupId) {
        console.warn(`[${getTimestamp()}] WARN: Subject group "${group}" not found for courses. Courses will be saved without a group_id.`);
      }
    } catch (dbError) {
      console.error(`[${getTimestamp()}] ERROR: Error fetching group ID for "${group}":`, dbError);
    }

    // Save courses to the database within a transaction
    await client.query('BEGIN'); // Start transaction
    for (const course of courses) {
      await client.query(
        'INSERT INTO courses (name, group_id, category) VALUES ($1, $2, $3) ON CONFLICT (name) DO NOTHING',
        [course, groupId, groupCategory]
      );
      console.info(`[${getTimestamp()}] INFO: Saved course "${course}" with group_id=${groupId}, category="${groupCategory}"`);
    }
    await client.query('COMMIT'); // Commit transaction

    console.info(`[${getTimestamp()}] INFO: Completed saving courses. Total courses saved/fetched: ${courses.length}`);

    return courses;
  } catch (error) {
    await client.query('ROLLBACK'); // Rollback on error
    console.error(`[${getTimestamp()}] ERROR: Error fetching UG courses:`, error);
    return [];
  } finally {
    client.release(); // Release client
  }
};