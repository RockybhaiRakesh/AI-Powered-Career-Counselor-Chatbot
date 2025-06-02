import { model } from '../gemini';
import { log } from '@/app/lib/logger';

const getTimestamp = (): string => {
  const now = new Date();
  return now.toISOString().replace('T', ' ').split('.')[0];
};

export const getCareerPathSummary = async (selected: {
  group: string;
  subjects: string; // Assuming subjects are joined for summary
  interest: string; // Assuming interests are joined for summary
  course: string;
  college: string;
  exam: string;
  cutoff: string;
}) => {
  log.info(`[${getTimestamp()}] getCareerPathSummary called with: ${JSON.stringify(selected)}`);

  if (!model) {
    log.error(`[${getTimestamp()}] Gemini model is not initialized. Cannot generate career path summary.`);
    return 'Error: Career path summary generation failed due to model initialization issue.';
  }

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

  try {
    log.info(`[${getTimestamp()}] Sending prompt to Gemini model...`);
    const result = await model.generateContent(prompt);
    const summary = await result.response.text();
    log.info(`[${getTimestamp()}] Received career path summary: ${summary}`);
    return summary;
  } catch (error) {
    log.error(`[${getTimestamp()}] Error generating career path summary: ${error}`);
    return 'Error: Unable to generate career path summary at this time.';
  }
};
