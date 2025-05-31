// src/lib/tools/getCollegesByCourse.ts
import { model } from '../gemini'; // Assuming this imports your initialized Gemini model
import db from '../db'; // Assuming this is your PostgreSQL database connection setup
// Helper function to get timestamp in "YYYY-MM-DD HH:MM:SS" format
const getTimestamp = () => {
  const now = new Date();
  return now.toISOString().split('T')[0] + ' ' + now.toTimeString().split(' ')[0];
};

/**
 * Fetches reputable colleges offering a specific undergraduate course from the LLM,
 * and saves them into the 'colleges' table, linking them to the course
 * in the 'college_courses' table.
 *
 * @param course The undergraduate course name (e.g., "B.Tech in Computer Science").
 * @returns A Promise that resolves to an array of strings representing college names with ratings.
 */
export const getCollegesByCourse = async (
  course: string
): Promise<string[]> => {
  console.log(`[${getTimestamp()}] INFO: Started fetching colleges for course "${course}"`);

  // Defensive check: Ensure Gemini model is initialized
  if (!model) {
    console.error(`[${getTimestamp()}] ERROR: Gemini model is not initialized. Cannot fetch colleges.`);
    return [];
  }

  // LLM Prompt: Instruct Gemini to list colleges and their ratings, grouped by location.
  const prompt = `
You are an AI career assistant specializing in Indian higher education.
List **reputable and well-established colleges in India that definitively offer the undergraduate course "${course}"**.
Focus strictly on colleges known for genuinely offering this specific UG program.

For each college, include:
- College Name
- Its approximate **India ranking or rating** (e.g., NIRF ranking if available, or a general reputational term like "Highly Reputed", "Well-regarded"). Do NOT invent specific numerical rankings or fabricate college names.

Group colleges under "India (All India)" and "Tamil Nadu".
Ensure all listed colleges truly offer the exact specified undergraduate course. Do NOT list colleges that do not offer this course or invent college names/rankings.

Format:

India (All India):
1. College Name – Rating/Ranking
2. College Name – Rating/Ranking
...

Tamil Nadu:
1. College Name – Rating/Ranking
2. College Name – Rating/Ranking
...

Return only this structured list. No other text, no conversational filler.
`;

  try {
    // 1. Call the Gemini model
    const result = await model.generateContent(prompt);
    const text = await result.response.text();

    console.log(`[${getTimestamp()}] INFO: Received response from Gemini:\n${text}`);

    // 2. Parse the LLM's response
    const lines = text.split('\n').map(line => line.trim()).filter(line => line !== '');
    const collegesListToReturn: string[] = []; // This will hold the formatted list to return to the caller
    let currentLocationState: string | null = null; // To track the current location category (India/Tamil Nadu)

    // 3. Get the ID of the course from the database. This is needed to link colleges to this course.
    const courseRes = await db.query('SELECT id FROM courses WHERE name = $1', [course]);
    const courseId = courseRes.rows?.[0]?.id;

    if (!courseId) {
      console.warn(`[${getTimestamp()}] WARN: Course '${course}' not found in the database. Colleges will be saved but cannot be directly linked to this course.`);
      // Continue execution, as we can still save the college information itself.
    } else {
      console.log(`[${getTimestamp()}] INFO: Found course ID ${courseId} for course '${course}'`);
    }

    // 4. Iterate through the parsed lines to extract college data and save to DB
    for (const line of lines) {
      // Identify the location category headers
      if (line.startsWith('India (All India):')) {
        currentLocationState = 'India (All India)';
        console.log(`[${getTimestamp()}] INFO: Processing location category "${currentLocationState}"`);
        continue; // Skip to the next line after setting the category
      } else if (line.startsWith('Tamil Nadu:')) {
        currentLocationState = 'Tamil Nadu';
        console.log(`[${getTimestamp()}] INFO: Processing location category "${currentLocationState}"`);
        continue; // Skip to the next line after setting the category
      }

      // Parse individual college entries (e.g., "1. College Name – Rating/Ranking")
      const match = line.match(/^\d+\.\s(.*?)\s*–\s*(.*)$/);
      if (match && currentLocationState) { // Ensure it's a valid college line and a location state is set
        const collegeName = match[1].trim();
        const ratingRanking = match[2].trim();

        // Add the original formatted line to the list that will be returned
        collegesListToReturn.push(line);

        let collegeId: number | undefined;

        // 5. Insert the college into the 'colleges' table or retrieve its existing ID
        const insertCollegeRes = await db.query(
          'INSERT INTO colleges (name, location_state, rating_ranking) VALUES ($1, $2, $3) ON CONFLICT (name) DO NOTHING RETURNING id',
          [collegeName, currentLocationState, ratingRanking]
        );

        if (insertCollegeRes.rows.length > 0) {
          // If a new college was inserted, get its ID directly
          collegeId = insertCollegeRes.rows[0].id;
          console.log(`[${getTimestamp()}] INFO: Inserted new college "${collegeName}" with ID ${collegeId}`);
        } else {
          // If the college already existed (due to ON CONFLICT), retrieve its ID
          const selectCollegeRes = await db.query('SELECT id FROM colleges WHERE name = $1', [collegeName]);
          collegeId = selectCollegeRes.rows[0]?.id;
          console.log(`[${getTimestamp()}] INFO: Found existing college "${collegeName}" with ID ${collegeId}`);
        }

        // 6. Link the college to the course in the 'college_courses' table
        if (collegeId && courseId) {
          await db.query(
            'INSERT INTO college_courses (college_id, course_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [collegeId, courseId] // 'ON CONFLICT DO NOTHING' prevents duplicate links
          );
          console.log(`[${getTimestamp()}] INFO: Linked college ID ${collegeId} to course ID ${courseId}`);
        } else if (collegeId && !courseId) {
          // Warn if college was saved but linking to course failed (course not found)
          console.warn(`[${getTimestamp()}] WARN: College '${collegeName}' saved, but could not link to course '${course}' (course not found in DB).`);
        } else {
          // Warn if college ID couldn't be obtained at all
          console.warn(`[${getTimestamp()}] WARN: Could not find or create college ID for: '${collegeName}'. Skipping course linkage.`);
        }
      }
    }

    console.log(`[${getTimestamp()}] INFO: Completed processing colleges. Total colleges parsed: ${collegesListToReturn.length}`);

    // 7. Return the formatted list of colleges
    return collegesListToReturn;
  } catch (error) {
    console.error(`[${getTimestamp()}] ERROR: Error fetching colleges:`, error);
    return []; // Return an empty array on error
  }
};
