// src/lib/tools/getCoursesByInterest.ts
import { model } from '../gemini';

export const getCoursesByInterest = async (
  interest: string[], // Expects an array of strings
  group: string
): Promise<string[]> => {
  if (!model) {
    console.error("Gemini model is not initialized. Cannot fetch UG courses.");
    return [];
  }

  const interestsList = interest.join(', '); // Join for the prompt

  const prompt = `
You are an AI career counselor specializing in Indian higher education.
Based on a student's interests: **${interestsList}** and academic background: "${group}",
list **only officially recognized and commonly offered Undergraduate (UG) degree programs** in India that directly and strongly align with these inputs.

- Include UG programs such as B.Sc, B.Tech, B.Com, B.A, B.Ed, BBA, BCA, MBBS, B.Arch, etc.
- Focus strictly on programs where the listed interests and academic group are a clear and direct foundation.
- Do NOT invent programs or list those not genuinely available as UG degrees in India.
- Format as a **numbered list** (e.g., 1. B.Sc in Physics).
- Provide only the degree names, no explanations or descriptions.
- Ensure the list is relevant and accurate based on common Indian university offerings.
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