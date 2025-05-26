// src/lib/tools/getCareerPathSummary.ts
import { model } from '../gemini';

export const getCareerPathSummary = async (selected: {
  group: string;
  subjects: string; // Assuming subjects are joined for summary
  interest: string; // Assuming interests are joined for summary
  course: string;
  college: string;
  exam: string;
  cutoff: string;
}) => {
  const prompt = `
Provide a concise, comprehensive career path summary based on the following student details:

- **12th Standard Group:** ${selected.group}
- **Subjects Studied:** ${selected.subjects}
- **Selected Interests:** ${selected.interest}
- **Chosen Undergraduate Course:** ${selected.course}
- **Target College:** ${selected.college}
- **Relevant Entrance Exam:** ${selected.exam}
- **Predicted Exam Cutoff/Requirement:** ${selected.cutoff}

Integrate all these details into a cohesive paragraph or two. Focus on the logical progression from subjects and interests to the chosen course, the relevance of the college and exam, and what this path generally entails. Do not include any conversational filler, just the summary.
`;
  const result = await model.generateContent(prompt);
  return result.response.text();
};