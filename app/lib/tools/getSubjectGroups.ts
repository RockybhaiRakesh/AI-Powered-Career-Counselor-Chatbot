import { model } from '../gemini'; // Assuming this imports your GenerativeModel instance

export const getSubjectGroups = async () => {
  // Use the exact, highly constrained prompt here
  const prompt = `Generate a list of common 12th standard (Indian curriculum) academic streams, including common variations, formatted strictly as a newline-separated list, with each item starting with the main stream name. Do not include any introductory or concluding text, explanations, or numbering.

Science with Biology
Science with Computer
Commerce with Maths
Commerce without Maths
Humanities / Arts

Now generate the actual list.`; // The example format is part of the prompt for clarity

  const result = await model.generateContent(prompt);

  // Since the prompt asks for a newline-separated list WITHOUT numbering or extra text,
  // you can simply split the response text by newlines.
  // Using .trim() on each item is a good practice to remove any leading/trailing whitespace.
  // Filtering out empty strings ensures no blank lines if the model adds extra newlines.
  return result.response.text().split('\n').map(item => item.trim()).filter(item => item.length > 0);
};