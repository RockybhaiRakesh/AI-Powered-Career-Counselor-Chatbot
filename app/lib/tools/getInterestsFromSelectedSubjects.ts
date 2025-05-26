// src/lib/tools/getInterestsFromSelectedSubjects.ts
import { model } from '../gemini'; // Adjust path based on your project structure

export const getInterestsFromSelectedSubjects = async (
  selectedSubjects: string[] // This should be an array of specific subjects
): Promise<string[]> => {
  if (!model) {
    console.error("Gemini model is not initialized. Cannot fetch interests.");
    return [];
  }

  const subjectsList = selectedSubjects.join(', ');

  const prompt = `
For a 12th standard student who has studied: **${subjectsList}**,
list a **broad and extensive range of career-related interests, specialized fields, and emerging interdisciplinary areas**.

Prioritize strong connections to the listed subjects, including both direct career paths and logical extensions into related or interdisciplinary fields. Include both traditional and modern/future-oriented areas.

- Provide only the interest names.
- Format as a **bulleted list** (e.g., - Artificial Intelligence, - Quantum Computing).
- No introductory/concluding sentences, explanations, or descriptions.
`;

  try {
    const result = await model.generateContent(prompt);
    const text = await result.response.text();

    const interests = text.match(/^- (.*)/gm)?.map(item =>
      item.replace(/^- /, '').trim()
    ) || [];

    // Filter out any potential non-string results or empty strings after trimming
    return Array.from(new Set(interests.filter(item => typeof item === 'string' && item.length > 0)));

  } catch (error) {
    console.error(`Error fetching interests for subjects "${subjectsList}":`, error);
    return [];
  }
};