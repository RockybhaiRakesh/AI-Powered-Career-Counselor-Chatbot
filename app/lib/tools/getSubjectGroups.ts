import { model } from '../gemini';
export const getSubjectGroups = async () => {
  const prompt = 'List 5-7 higher secondary subject groups in India for 12th grade students. Format each as a numbered list item.';
  const result = await model.generateContent(prompt);
  return result.response.text().match(/^\d+\.\s(.*)/gm)?.map(item => item.replace(/^\d+\.\s/, '').trim()) || [];
};
