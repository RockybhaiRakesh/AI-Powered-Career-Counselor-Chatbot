import { model } from '../gemini';
export const getCutoffForExam = async (exam: string, college: string) => {
  const prompt = `What is the typical cutoff or percentage required in the "${exam}" exam for getting into "${college}"? Provide a clear, concise answer.`;
  const result = await model.generateContent(prompt);
  return result.response.text();
};
