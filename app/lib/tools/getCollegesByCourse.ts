import { model } from '../gemini';
export const getCollegesByCourse = async (course: string) => {
  const prompt = `List 5-7 top colleges in India offering the course "${course}". Format each as a numbered list item.`;
  const result = await model.generateContent(prompt);
  return result.response.text().match(/^\d+\.\s(.*)/gm)?.map(item => item.replace(/^\d+\.\s/, '').trim()) || [];
};
