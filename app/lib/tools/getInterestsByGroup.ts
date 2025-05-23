import { model } from '../gemini';
export const getInterestsByGroup = async (group: string) => {
  const prompt = `List 5-7 common interests for students in the "${group}" group. Format each as a numbered list item.`;
  const result = await model.generateContent(prompt);
  return result.response.text().match(/^\d+\.\s(.*)/gm)?.map(item => item.replace(/^\d+\.\s/, '').trim()) || [];
};
