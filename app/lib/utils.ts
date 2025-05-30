// // app/lib/utils.ts

// import { GoogleGenerativeAI, GenerativeModel, Part } from '@google/generative-ai'; // Import GenerativeModel and Part types

// // Declare variables to hold the GoogleGenerativeAI client and the embedding model instance.
// // They are initialized lazily (on first use) to ensure environment variables are loaded.
// let generativeAIClient: GoogleGenerativeAI | null = null;
// // Explicitly type embeddingModel as GenerativeModel for clarity, as it handles embedContent
// let embeddingModel: GenerativeModel | null = null;

// /**
//  * Embeds a given text string into a vector (array of numbers) using the Google Generative AI embedding model.
//  * The model is initialized lazily on the first call to ensure environment variables are available.
//  *
//  * @param {string} text The text string to embed.
//  * @returns {Promise<number[]>} A promise that resolves to an array of numbers representing the embedding.
//  * @throws {Error} If the Google API Key is not set in environment variables or if embedding fails.
//  */
// export async function embedText(text: string): Promise<number[]> {
//     // Check if the Google API Key is available in environment variables.
//     // This check is inside the function to ensure it runs after dotenv has loaded the variables.
//     if (!process.env.NEXT_PUBLIC_GOOGLE_API_KEY) {
//         throw new Error("Google API Key is not set in environment variables.");
//     }

//     // Initialize the GoogleGenerativeAI client if it hasn't been initialized yet.
//     // This ensures the client is created only once.
//     if (!generativeAIClient) {
//         generativeAIClient = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GOOGLE_API_KEY);
//         // Get the specific embedding model. "embedding-001" is a common choice.
//         // Ensure this model name is correct for embedding.
//         embeddingModel = generativeAIClient.getGenerativeModel({ model: "embedding-001" });
//     }

//     // Ensure the embedding model is successfully initialized before proceeding.
//     if (!embeddingModel) {
//         throw new Error("Embedding model could not be initialized.");
//     }

//     try {
//         const result = await embeddingModel.embedContent(text);
//         // Extract the array of embedding values from the result.
//         const embeddings = result.embedding.values;

//         // Return the generated embeddings.
//         return embeddings;
//     } catch (error) {
//         // Log any errors that occur during the embedding process.
//         console.error("Error embedding text with Gemini:", error);
//         throw error; // Re-throw the error to propagate it up the call stack.
//     }
// }

// /**
//  * Converts a string into a URL-friendly slug.
//  * @param {string} text The input string.
//  * @returns {string} The slugified string.
//  */
// export function createSlug(text: string): string {
//     return text
//         .toLowerCase()
//         .replace(/[^a-z0-9\s-]/g, '') // Remove non-alphanumeric characters except spaces and hyphens
//         .replace(/\s+/g, '-')       // Replace spaces with hyphens
//         .replace(/-+/g, '-')        // Replace multiple hyphens with a single hyphen
//         .trim();                    // Trim leading/trailing whitespace (including hyphens)
// }