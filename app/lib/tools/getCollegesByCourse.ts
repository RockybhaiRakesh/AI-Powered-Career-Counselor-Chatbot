import { model } from '../gemini'; // Assuming this imports your initialized Gemini model
import db from '../db'; // Assuming this is your PostgreSQL database connection setup
import { log } from '@/app/lib/logger';

// Helper function to get timestamp in "YYYY-MM-DD HH:MM:SS" format
const getTimestamp = (): string => {
  const now = new Date();
  return now.toISOString().replace('T', ' ').split('.')[0]; // Consistent format
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
  log.info(`Started fetching colleges for course "${course}"`);

  if (!model) {
    log.error(`Gemini model is not initialized. Cannot fetch colleges.`);
    return [];
  }

  const prompt = `
You are an AI career assistant specializing in Indian higher education.
List **reputable and well-established colleges in India that definitively offer the undergraduate course "${course}"**.
Focus strictly on colleges known for genuinely offering this specific UG program.

**Strictly adhere to the following rules for content and format:**
- **Do NOT invent colleges or rankings.** Only list real, established colleges.
- **Do NOT list colleges that do not genuinely offer this exact undergraduate course.**
- **For each college, include:** College Name and its approximate India ranking or rating (e.g., NIRF ranking if available, or a general reputational term like "Highly Reputed", "Well-regarded").
- **Group colleges under "India (All India)" and "Tamil Nadu" ONLY.**
- **Return ONLY this structured list.** No other text, no conversational filler, no introductory/concluding remarks.

**Example Format:**

India (All India):
1. Indian Institute of Technology Bombay (IIT Bombay) – NIRF Ranking 3
2. Delhi Technological University (DTU) – Highly Reputed

Tamil Nadu:
1. Anna University, Chennai – State Rank 1
2. Vellore Institute of Technology (VIT), Vellore – Well-regarded
`;

  const client = await db.connect();
  try {
    log.info(`Sending prompt to Gemini for course "${course}"`);
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    log.info(`Received response from Gemini:\n${text}`);

    const lines = text.split('\n').map(line => line.trim()).filter(line => line !== '');
    const collegesListToReturn: string[] = [];
    let currentLocationState: string | null = null;

    const courseRes = await client.query('SELECT id FROM courses WHERE name = $1', [course]);
    const courseId = courseRes.rows?.[0]?.id;

    if (!courseId) {
      log.warn(`Course '${course}' not found in DB. Colleges will be saved but cannot be linked.`);
    } else {
      log.info(`Found course ID ${courseId} for course '${course}'`);
    }

    await client.query('BEGIN');
    log.info(`Started DB transaction for saving colleges and linking courses.`);

    for (const line of lines) {
      if (line.startsWith('India (All India):')) {
        currentLocationState = 'India (All India)';
        log.info(`Processing location category "${currentLocationState}"`);
        continue;
      } else if (line.startsWith('Tamil Nadu:')) {
        currentLocationState = 'Tamil Nadu';
        log.info(`Processing location category "${currentLocationState}"`);
        continue;
      }

      const match = line.match(/^\d+\.\s(.*?)\s*–\s*(.*)$/);
      if (match && currentLocationState) {
        const collegeName = match[1].trim();
        const ratingRanking = match[2].trim();

        collegesListToReturn.push(line);

        let collegeId: number | undefined;

        try {
          const insertCollegeRes = await client.query(
            'INSERT INTO colleges (name, location_state, rating_ranking) VALUES ($1, $2, $3) ON CONFLICT (name) DO NOTHING RETURNING id',
            [collegeName, currentLocationState, ratingRanking]
          );

          if (insertCollegeRes.rows.length > 0) {
            collegeId = insertCollegeRes.rows[0].id;
            log.info(`Inserted new college "${collegeName}" with ID ${collegeId}`);
          } else {
            const selectCollegeRes = await client.query('SELECT id FROM colleges WHERE name = $1', [collegeName]);
            collegeId = selectCollegeRes.rows[0]?.id;
            log.info(`Found existing college "${collegeName}" with ID ${collegeId}`);
          }
        } catch (dbErr) {
          log.error(`DB error inserting/selecting college "${collegeName}": ${dbErr}`);
          continue; // Skip this college and continue
        }

        if (collegeId && courseId) {
          try {
            await client.query(
              'INSERT INTO college_courses (college_id, course_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
              [collegeId, courseId]
            );
            log.info(`Linked college ID ${collegeId} to course ID ${courseId}`);
          } catch (linkErr) {
            log.error(`DB error linking college ID ${collegeId} to course ID ${courseId}: ${linkErr}`);
          }
        } else if (collegeId && !courseId) {
          log.warn(`College '${collegeName}' saved but could not link to course '${course}' (course not found in DB).`);
        } else {
          log.warn(`Could not find or create college ID for '${collegeName}'. Skipping linking.`);
        }
      }
    }

    await client.query('COMMIT');
    log.info(`Completed DB transaction for colleges. Total colleges processed: ${collegesListToReturn.length}`);

    return collegesListToReturn;
  } catch (error) {
    await client.query('ROLLBACK');
    log.error(`Error in getCollegesByCourse: ${error}`);
    return [];
  } finally {
    client.release();
  }
};
