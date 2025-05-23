import { model } from '../gemini';

export const getCoursesByInterest = async (
  interest: string,
  group: string
): Promise<string[]> => {
  const prompt = `
You are an AI career counselor. Suggest 5 to 7 **Undergraduate (UG)** degree programs for a student interested in "${interest}" with a "${group}" academic background.

- Only include **UG programs** like B.Sc, B.A., B.Tech, B.Com, etc.
- Format the response as a **numbered list** (e.g., 1. B.Sc in Physics).
- Do **not** include explanations or descriptions — only the degree names.
`;

  try {
    const result = await model.generateContent(prompt);
    const text = await result.response.text();

    return (
      text.match(/^\d+\.\s(.*)/gm)?.map((item) =>
        item.replace(/^\d+\.\s/, '').trim()
      ) || []
    );
  } catch (error) {
    console.error("Error fetching UG courses:", error);
    return [];
  }
};
