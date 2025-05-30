// // app/lib/pinecone.ts
// import { Pinecone } from '@pinecone-database/pinecone';

// // This file should NOT directly initialize Pinecone at the top level.
// // Instead, the initialization should happen inside a function that is called
// // AFTER environment variables are guaranteed to be loaded (e.g., in embedData.ts).

// let pineconeClient: Pinecone | null = null; // Declare a variable to hold the Pinecone client

// export const getPineconeIndex = async () => {
//     // --- Debugging Pinecone Env Vars (moved inside function) ---
//     console.log('--- Debugging Pinecone Env Vars (inside getPineconeIndex) ---');
//     console.log('PINECONE_API_KEY:', process.env.PINECONE_API_KEY ? 'Set' : 'Not Set');
//     console.log('PINECONE_INDEX_NAME:', process.env.PINECONE_INDEX_NAME ? 'Set' : 'Not Set');
//     console.log('PINECONE_INDEX_HOST:', process.env.PINECONE_INDEX_HOST ? 'Set' : 'Not Set');
//     console.log('-----------------------------------');
//     // --- END Debugging Pinecone Env Vars ---

//     if (!process.env.PINECONE_API_KEY || !process.env.PINECONE_INDEX_NAME) {
//         throw new Error('Pinecone API Key or Index Name not set in environment variables');
//     }

//     if (!process.env.PINECONE_INDEX_HOST) {
//         throw new Error('Pinecone Index Host (or Base URL) not set in environment variables');
//     }

//     // Initialize Pinecone client only once, if it hasn't been initialized yet
//     if (!pineconeClient) {
//         pineconeClient = new Pinecone({
//             apiKey: process.env.PINECONE_API_KEY,
//         });
//     }

//     const indexName = process.env.PINECONE_INDEX_NAME!;
//     const indexHost = process.env.PINECONE_INDEX_HOST!;

//     const index = pineconeClient.Index(indexName);

//     try {
//         await pineconeClient.describeIndex(indexName); // Use the client instance to describe
//     } catch (error) {
//         console.error(`Index "${indexName}" might not exist or there's an issue describing it:`, error);
//         throw error;
//     }

//     return index;
// };