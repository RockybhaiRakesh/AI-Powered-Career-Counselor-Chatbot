import { model } from '../gemini';
export const getCareerPathSummary = async (selected: any) => {
  const prompt = `Summarize the career path for a student in group "${selected.group}" with interest in "${selected.interest}", pursuing "${selected.course}" at "${selected.college}". Provide a clear, concise answer.`;
  const result = await model.generateContent(prompt);
  return result.response.text();
};
