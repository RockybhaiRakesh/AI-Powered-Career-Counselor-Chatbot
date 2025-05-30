// scripts/queryData.ts

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { getPineconeIndex } from '../app/lib/pinecone.js';
import { embedText } from '../app/lib/utils.js';

const queryPinecone = async (query: string) => {
  try {
    const index = await getPineconeIndex();
    const embedding = await embedText(query);

    const result = await index.query({
      vector: embedding,
      topK: 5, // Adjust to get more or fewer results
      includeMetadata: true,
    });

    const matches = result.matches || [];
    if (matches.length === 0) {
      console.log('No matches found.');
      return;
    }

    console.log(`Top matches for: "${query}"`);
    for (const match of matches) {
      console.log(`- ${match.metadata?.type}: ${match.metadata?.name} (Score: ${match.score?.toFixed(4)})`);
    }
  } catch (error) {
    console.error('Error querying Pinecone:', error);
  }
};

// Example usage
const userQuery = process.argv[2] || 'Biology'; // You can pass a query via CLI
queryPinecone(userQuery);
