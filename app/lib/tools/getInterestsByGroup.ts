import { model } from '../gemini';

export const getInterestsByGroup = async (group: string): Promise<string[]> => {
  const prompt = `
You are an AI educational counselor. List 6-8 **meaningful interests or passions** commonly associated with students in the "${group}" subject group. 
- Each interest should be specific (e.g., "Problem-solving", "Creative writing", "Coding simulations", "Exploring the universe").
- Return only a numbered list (e.g., 1. Interest).
- Do NOT include explanations or descriptions, only the list.
`;

  try {
    const result = await model.generateContent(prompt);
    const text = await result.response.text();

    return (
      text.match(/^\d+\.\s(.*)/gm)?.map(item =>
        item.replace(/^\d+\.\s/, '').trim()
      ) || []
    );
  } catch (error) {
    console.error("Error fetching interests:", error);
    return [];
  }
};
