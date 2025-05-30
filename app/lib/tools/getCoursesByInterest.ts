// src/lib/tools/getCoursesByInterest.ts

import db from '../db';
import { model } from '../gemini';

// Helper function to get timestamp
const getTimestamp = () => {
  const now = new Date();
  return now.toISOString().split('T')[0] + ' ' + now.toTimeString().split(' ')[0];
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
  console.log(`[${getTimestamp()}] INFO: Started fetching UG courses for interests=[${interest.join(', ')}], group="${group}"`);

  if (!model) {
    console.error(`[${getTimestamp()}] ERROR: Gemini model is not initialized. Cannot fetch UG courses.`);
    return [];
  }

  const interestsList = interest.join(', '); // Join for the prompt

  const prompt = `
You are an AI career counselor specializing in Indian higher education.
Based on a student's interests: **${interestsList}** and academic background: "${group}",
list **only officially recognized and commonly offered Undergraduate (UG) degree programs** in India that directly and strongly align with these inputs.

- Include UG programs such as B.Sc, B.Tech, B.Com, B.A, B.Ed, BBA, BCA, MBBS, B.Arch, etc.
- Focus strictly on programs where the listed interests and academic group are a clear and direct foundation.
- Do NOT invent programs or list those not genuinely available as UG degrees in India.
- Format as a **numbered list** (e.g., 1. B.Sc in Physics).
- Provide only the degree names, no explanations or descriptions.
- Ensure the list is relevant and accurate based on common Indian university offerings.
`;

  try {
    const result = await model.generateContent(prompt);
    const text = await result.response.text();

    console.log(`[${getTimestamp()}] INFO: Received courses list from Gemini:\n${text}`);

    const courses = text.match(/^\d+\.\s(.*)/gm)?.map((item) =>
      item.replace(/^\d+\.\s/, '').trim()
    ) || [];

    // Get the group_id for linking courses
    let groupId: number | null = null;
    let groupCategory: string = group; // Use group name as category for courses too
    try {
      const groupResult = await db.query('SELECT id FROM subject_groups WHERE name = $1', [group]);
      groupId = groupResult.rows?.[0]?.id || null;
      if (!groupId) {
        console.warn(`[${getTimestamp()}] WARN: Subject group "${group}" not found for courses. Courses will be saved without a group_id.`);
      }
    } catch (dbError) {
      console.error(`[${getTimestamp()}] ERROR: Error fetching group ID for "${group}":`, dbError);
    }

    // Save courses to the database
    for (const course of courses) {
      await db.query(
        'INSERT INTO courses (name, group_id, category) VALUES ($1, $2, $3) ON CONFLICT (name) DO NOTHING',
        [course, groupId, groupCategory]
      );
      console.log(`[${getTimestamp()}] INFO: Saved course "${course}" with group_id=${groupId}, category="${groupCategory}"`);
    }

    console.log(`[${getTimestamp()}] INFO: Completed saving courses. Total courses saved/fetched: ${courses.length}`);

    return courses;
  } catch (error) {
    console.error(`[${getTimestamp()}] ERROR: Error fetching UG courses:`, error);
    return [];
  }
};
