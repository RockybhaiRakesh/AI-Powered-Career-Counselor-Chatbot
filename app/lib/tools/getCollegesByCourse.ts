// src/lib/tools/getCollegesByCourse.ts
import { model } from '../gemini';

export const getCollegesByCourse = async (
  course: string
): Promise<string[]> => {
  if (!model) {
    console.error("Gemini model is not initialized. Cannot fetch colleges.");
    return [];
  }

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
    const result = await model.generateContent(prompt);
    const text = await result.response.text();

    // Return as array of strings split by newlines
    return text.split('\n').map(line => line.trim()).filter(line => line !== '');
  } catch (error) {
    console.error("Error fetching colleges:", error);
    return [];
  }
};