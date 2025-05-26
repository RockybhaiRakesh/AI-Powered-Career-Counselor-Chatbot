// app/lib/tools/chat.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GOOGLE_API_KEY!);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

export async function getChatResponse(messages: { role: string; content: string }[]) {
  // Defensive check: Ensure there's at least one message from the user.
  // In a real application, you might want more robust validation or error handling.
  if (messages.length === 0) {
    return { content: "Please provide a message to chat." };
  }

  // The last message in the array is the current user's input.
  const latestUserMessage = messages[messages.length - 1];
  // The rest of the messages form the history, excluding the latest user message.
  const chatHistory = messages.slice(0, messages.length - 1);

  // Map the chat history to the format expected by the Gemini API
  const formattedHistory = chatHistory.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model', // Ensure roles are 'user' or 'model'
    parts: [{ text: msg.content }],
  }));

  // Start the chat session with the provided history
  // The Gemini API requires the history to start with a 'user' role if history is not empty.
  // This is handled by filtering the initial assistant message in ChatBot.tsx before sending.
  const chat = model.startChat({
    history: formattedHistory,
  });

  try {
    // Send only the latest user message to the active chat session.
    // The chat object intelligently appends this to its internal history.
    const result = await chat.sendMessage(latestUserMessage.content);
    const response = await result.response;
    const text = response.text(); // Ensure you await .text() as it's an async operation

    return { content: text };
  } catch (error) {
    console.error("Error getting chat response from Gemini API:", error);
    // Return a user-friendly error message
    return { content: "I'm sorry, I couldn't get a response from the AI at this time. Please try again later." };
  }
}