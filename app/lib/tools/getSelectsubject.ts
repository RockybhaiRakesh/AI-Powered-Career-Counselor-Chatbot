// src/lib/tools/getSelectsubjects.ts
import { model } from '../gemini';

export const getSelectSubjects = async (group: string) => {
  const prompt = `List the main subjects typically studied in the "${group}" stream in Indian 12th standard education.
  Provide only the subjects as a numbered list, one per line, without any additional text or explanations.

  Example format for Science with Biology:
  1. Physics
  2. Chemistry
  3. Biology
  4. Mathematics
  5. English`;

  const result = await model.generateContent(prompt);

  return result.response.text()
    .split('\n')
    .map(item => item.replace(/^\d+\.\s/, '').trim())
    .filter(item => item.length > 0);
};