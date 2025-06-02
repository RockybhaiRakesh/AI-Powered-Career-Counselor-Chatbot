// src/lib/tools/getInterestsFromSelectedSubjects.ts

import db from '../db';
import { model } from '../gemini';

// Helper for consistent timestamp logging
const getTimestamp = (): string => {
  const now = new Date();
  return now.toISOString().replace('T', ' ').split('.')[0];
};

/**
 * Generates career-related interests based on selected 12th standard subjects,
 * stores them in the 'interests' table, and links them to the subjects
 * in the 'subject_interests' table.
 *
 * This function focuses on generating new interests if needed and linking them
 * efficiently. It leverages database's ON CONFLICT for idempotency, ensuring
 * that existing interests and subject-interest links are not duplicated.
 *
 * @param selectedSubjects An array of strings representing the selected subjects (e.g., ['Physics', 'Chemistry', 'Mathematics']).
 * @returns A Promise that resolves to an array of unique generated interests (strings).
 */
export const getInterestsFromSelectedSubjects = async (selectedSubjects: string[]): Promise<string[]> => {
  if (!model) {
    console.warn(`[${getTimestamp()}] ⚠️ Gemini model not initialized. Returning empty interests.`);
    return [];
  }

  if (selectedSubjects.length === 0) {
    console.warn(`[${getTimestamp()}] ⚠️ No subjects provided. Returning empty interests.`);
    return [];
  }

  console.info(`[${getTimestamp()}] 🎯 Generating career interests for selected subjects:`, selectedSubjects);

  let mainCategoryForInterests: string | null = null;
  const client = await db.connect(); // Get a client from the pool for transaction

  try {
    // Attempt to determine a main category for the generated interests
    // based on the category of the first selected subject.
    const firstSubjectName = selectedSubjects[0];
    console.info(`[${getTimestamp()}] 🔍 Fetching category for subject: '${firstSubjectName}'...`);
    const subjectCategoryRes = await client.query( // Use client for queries
      'SELECT category FROM subjects WHERE name = $1 LIMIT 1',
      [firstSubjectName]
    );
    if (subjectCategoryRes.rows.length > 0) {
      mainCategoryForInterests = subjectCategoryRes.rows[0].category;
      console.info(`[${getTimestamp()}] 📚 Using category "${mainCategoryForInterests}" from subject "${firstSubjectName}".`);
    } else {
      console.warn(`[${getTimestamp()}] ⚠️ Category not found in DB for subject: '${firstSubjectName}'. Interests might be saved without a specific category.`);
    }

    // Prepare the prompt for the LLM based on the selected subjects.
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

    // 1. Call the LLM to generate interests.
    console.info(`[${getTimestamp()}] 🧠 Sending prompt to Gemini for interest generation...`);
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // 2. Parse the LLM's response to extract unique interests.
    // Use a more robust regex to handle potential variations in bullet points, though prompt tries to enforce.
    const interests = text.split('\n')
                           .map(line => line.replace(/^[-\*\d\.]*\s*/, '').trim()) // Remove common list prefixes
                           .filter(item => item.length > 0);
    const uniqueInterests = Array.from(new Set(interests));
    console.info(`[${getTimestamp()}] 📊 Gemini returned ${uniqueInterests.length} unique interests:`, uniqueInterests);

    // 3. Process each unique interest: insert/retrieve and link to subjects within a transaction
    await client.query('BEGIN'); // Start transaction for atomicity

    for (const interest of uniqueInterests) {
      let interestId: number | undefined;

      // Insert the interest into the 'interests' table.
      // 'ON CONFLICT (name) DO NOTHING' ensures no duplicates and allows retrieval of existing ID.
      const insertRes = await client.query( // Use client for queries
        'INSERT INTO interests (name, category) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING RETURNING id',
        [interest, mainCategoryForInterests]
      );

      if (insertRes.rows.length > 0) {
        // If the interest was newly inserted, its ID is returned.
        interestId = insertRes.rows[0].id;
        console.info(`[${getTimestamp()}] 💾 Newly inserted interest: '${interest}' (ID: ${interestId})`);
      } else {
        // If the interest already existed, retrieve its ID.
        const selectRes = await client.query('SELECT id FROM interests WHERE name = $1', [interest]); // Use client
        interestId = selectRes.rows[0]?.id;
        console.info(`[${getTimestamp()}] ℹ️ Interest '${interest}' already exists in DB (ID: ${interestId}).`);
      }

      // If, for any reason, interestId could not be resolved, skip linking for this interest.
      if (!interestId) {
        console.warn(`[${getTimestamp()}] ⚠️ Could not resolve ID for interest '${interest}'. Skipping subject-interest linking.`);
        continue;
      }

      // 4. Link this interest to each of the selected subjects in 'subject_interests' table.
      for (const subject of selectedSubjects) {
        const subjectRes = await client.query('SELECT id FROM subjects WHERE name = $1', [subject]); // Use client
        const subjectId = subjectRes.rows[0]?.id;

        if (subjectId) {
          await client.query( // Use client
            'INSERT INTO subject_interests (subject_id, interest_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [subjectId, interestId] // 'ON CONFLICT DO NOTHING' prevents duplicate linkages
          );
          console.info(`[${getTimestamp()}] 🔗 Successfully linked subject '${subject}' (ID: ${subjectId}) to interest '${interest}' (ID: ${interestId}).`);
        } else {
          console.warn(`[${getTimestamp()}] ⚠️ Subject '${subject}' not found in DB. Cannot link to interest '${interest}'.`);
        }
      }
    }

    await client.query('COMMIT'); // Commit transaction
    console.info(`[${getTimestamp()}] ✅ All unique interests processed and linked to selected subjects.`);
    return uniqueInterests;

  } catch (error) {
    await client.query('ROLLBACK'); // Rollback on error
    console.error(`[${getTimestamp()}] ❌ Error during interest generation or linking:`, error);
    return []; // Return an empty array on error
  } finally {
    client.release(); // Release the client back to the pool
  }
};