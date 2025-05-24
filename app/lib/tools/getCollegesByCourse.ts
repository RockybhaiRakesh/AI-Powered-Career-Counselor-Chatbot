import { model } from '../gemini';

export const getCollegesByCourse = async (
  course: string
): Promise<string[]> => {
  const prompt = `
You are an AI career assistant. List top  50+ colleges in India offering the course "${course}". Include both:

- Top colleges from **all over India**
- Reputed colleges from **Tamil Nadu**

For each college, include:

- College Name
- Its approximate **India ranking or rating** (e.g., NIRF)
- Group them under "India" and "Tamil Nadu" sections

Format:

1. College Name – Rating  India:
2. College Name – Rating  India:

1. College Name – Rating  Tamil Nadu:
2. College Name – Rating  Tamil Nadu:

Only return the structured list as shown above. No extra explanation.
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
