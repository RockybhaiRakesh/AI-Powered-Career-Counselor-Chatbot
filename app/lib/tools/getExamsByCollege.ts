import { model } from '../gemini';
export const getExamsByCollege = async (college: string, course: string) => {
  const prompt = `What are 3-5 entrance exams or cutoffs required for admission to "${college}" for the course "${course}"? Format each as a numbered list item.`;
  const result = await model.generateContent(prompt);
  return result.response.text().match(/^\d+\.\s(.*)/gm)?.map(item => item.replace(/^\d+\.\s/, '').trim()) || [];
};
