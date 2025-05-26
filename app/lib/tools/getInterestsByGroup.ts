// // src/lib/tools/getInterestsByGroup.ts
// import { model } from '../gemini'; // Assuming 'model' is properly initialized from your Gemini setup

// /**
//  * Fetches an extensive list of typical, common optional, and emerging skill-based/vocational
//  * subjects for a given 12th standard (Indian) subject group.
//  * Aims for a comprehensive list including less common but officially recognized subjects.
//  * @param group The name of the 12th standard subject group (e.g., "Science with Biology", "Commerce with Maths").
//  * @returns A promise that resolves to an array of strings, where each string is a subject.
//  */
// export const getInterestsByGroup = async (group: string): Promise<string[]> => {
//   if (!model) {
//     console.error("Gemini model is not initialized. Cannot fetch interests/subjects.");
//     return [];
//   }

//   // Adjusted prompt to focus on comprehensive, accurate list of *actual* subjects by group
//   const prompt = `
// You are an AI educational expert with comprehensive knowledge of the diverse Indian 12th standard (Higher Secondary) education system across various boards (CBSE, ICSE, State Boards).

// For the "${group}" group, list **all genuinely possible and officially recognized relevant subjects** at the 12th standard level in India. Include:
// 1.  **Compulsory Subjects:** Core subjects typically mandatory for this group across major boards.
// 2.  **Common Optional Subjects:** Widely available elective subjects.
// 3.  **Specialized/Niche Electives:** Less common but officially recognized subjects offered by some boards or schools, including those with vocational or skill-based focuses.
// 4.  **Emerging Skill-Based/Vocational Subjects:** Newer subjects introduced under recent reforms (e.g., NEP 2020), specifically for 12th standard.

// **Crucially, only include subjects that are definitively offered and officially recognized at the 12th standard (Higher Secondary) level in India.** Do not invent subjects, fabricate new ones, or include subjects primarily taught at undergraduate/postgraduate levels. The list should strictly adhere to what is currently or has recently been a valid 12th-standard subject.

// - Present the subjects as a single, continuous bulleted list (e.g., - Subject Name).
// - Do NOT categorize them under "Compulsory," "Optional," etc., just provide one long list.
// - Do NOT include any introductory or concluding sentences.
// - Do NOT include explanations or descriptions for the subjects, just their names.
// - Aim for a comprehensive list of all *actual* subjects relevant to the group, without any artificial numerical target. The goal is accuracy and completeness of existing subjects.
// `;

//   try {
//     const result = await model.generateContent(prompt);
//     const text = await result.response.text();

//     // This regex will capture lines that start with '-' followed by a space.
//     const subjects = text.match(/^- (.*)/gm)?.map(item =>
//       item.replace(/^- /, '').trim()
//     ) || [];

//     // Remove duplicates and return
//     return Array.from(new Set(subjects));

//   } catch (error) {
//     console.error(`Error fetching subjects for group "${group}":`, error); // Corrected parameter name
//     return []; // Return an empty array on error
//   }
// };