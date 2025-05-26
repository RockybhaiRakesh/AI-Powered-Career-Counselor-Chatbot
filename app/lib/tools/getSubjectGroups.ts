// src/lib/tools/getSubjectGroups.ts
import { model } from '../gemini'; // Assuming this imports your GenerativeModel instance

export const getSubjectGroups = async () => {
  const prompt = `
List the 6 most common 12th standard academic streams/groups in the Indian curriculum, including their standard variations.
Format: Newline-separated, no numbering, no introductory/concluding text.

Expected examples (strictly these types):
Science with Biology
Science with Computer
Commerce with Maths
Commerce without Maths
Humanities / Arts
Vocational Stream
`;

  try {
    const result = await model.generateContent(prompt);
    const text = await result.response.text();

    // Split, trim, filter, and then slice to ensure exactly 6 items
    const groups = text.split('\n')
                      .map(item => item.trim())
                      .filter(item => item.length > 0)
                      .slice(0, 6); // ENSURE ONLY 6 ITEMS ARE RETURNED

    return groups;

  } catch (error) {
    console.error("Error fetching subject groups:", error);
    return []; // Return empty array on error
  }
};