import { model } from '../gemini';
export const getCoursesByInterest = async (interest: string, group: string) => {
  const prompt = `Suggest 5-7 courses and degrees for someone interested in "${interest}" with a "${group}" background. Format each as a numbered list item.`;
  const result = await model.generateContent(prompt);
  return result.response.text().match(/^\d+\.\s(.*)/gm)?.map(item => item.replace(/^\d+\.\s/, '').trim()) || [];
};
