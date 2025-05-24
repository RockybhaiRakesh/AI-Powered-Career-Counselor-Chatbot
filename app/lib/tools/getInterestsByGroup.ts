import { model } from '../gemini'; // Assuming 'model' is properly initialized from your Gemini setup

/**
 * Fetches an extensive list of typical, common optional, and emerging skill-based/vocational
 * subjects for a given 12th standard (Indian) subject group.
 * Aims for a comprehensive list including less common subjects.
 * @param group The name of the 12th standard subject group (e.g., "Science Stream (PCM)", "Commerce Stream").
 * @returns A promise that resolves to an array of strings, where each string is a subject.
 */
export const getInterestsByGroup = async (group: string): Promise<string[]> => {
  const prompt = `
You are an AI educational expert with comprehensive knowledge of the diverse Indian 12th standard (Higher Secondary) education system across various boards (CBSE, ICSE, State Boards).

For the "${group}" group, list **all possible relevant subjects**, including:
1.  **Compulsory Subjects:** Core subjects typically mandatory for this group.
2.  **Common Optional Subjects:** Widely available elective subjects.
3.  **Specialized/Niche Electives:** Less common but officially recognized subjects offered by some boards or schools, including those with vocational or skill-based focuses.
4.  **Emerging Skill-Based/Vocational Subjects:** Newer subjects introduced under reforms like NEP 2020.

Aim to provide a very extensive list, striving for **5000+ based on "${group}" unique subjects** if applicable to the group.

- Present the subjects as a single, continuous bulleted list (e.g., - Subject Name).
- Do NOT categorize them under "Compulsory," "Optional," etc., just provide one long list.
- Do NOT include any introductory or concluding sentences.
- Do NOT include explanations or descriptions for the subjects, just their names.
`;

  try {
    const result = await model.generateContent(prompt);
    const text = await result.response.text();

    // This regex will capture lines that start with '-' followed by a space.
    const subjects = text.match(/^- (.*)/gm)?.map(item =>
      item.replace(/^- /, '').trim()
    ) || [];

    // Remove duplicates and return
    return Array.from(new Set(subjects));

  } catch (error) {
    console.error(`Error fetching subjects for group "${group}":`, error);
    return []; // Return an empty array on error
  }
};

// --- Example Usage ---
// Make sure you have your Gemini API setup (model from '../gemini')
/*
import { GoogleGenerativeAI } from '@google/generative-ai';

// Replace with your actual API Key
const API_KEY = "YOUR_GEMINI_API_KEY"; // Ensure this is securely handled
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });


async function runSubjectExamples() {
  console.log("Extensive Subjects for Science Stream (PCM):");
  const pcmSubjects = await get12thStandardSubjectsByGroup("Science Stream (PCM)");
  console.log(`Total subjects found: ${pcmSubjects.length}`);
  console.log(pcmSubjects);

  console.log("\nExtensive Subjects for Commerce Stream:");
  const commerceSubjects = await get12thStandardSubjectsByGroup("Commerce Stream");
  console.log(`Total subjects found: ${commerceSubjects.length}`);
  console.log(commerceSubjects);

  console.log("\nExtensive Subjects for Humanities / Arts Stream:");
  const artsSubjects = await get12thStandardSubjectsByGroup("Humanities / Arts Stream");
  console.log(`Total subjects found: ${artsSubjects.length}`);
  console.log(artsSubjects);

  console.log("\nExtensive Subjects for Science Stream (PCB):");
  const pcbSubjects = await get12thStandardSubjectsByGroup("Science Stream (PCB)");
  console.log(`Total subjects found: ${pcbSubjects.length}`);
  console.log(pcbSubjects);
}

runSubjectExamples();
*/