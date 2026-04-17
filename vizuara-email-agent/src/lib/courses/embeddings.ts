import OpenAI from "openai";

const EMBEDDING_MODEL = "text-embedding-3-small";
const BATCH_SIZE = 50;

function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY environment variable is not set");
  }
  return new OpenAI({ apiKey });
}

/**
 * Generate an embedding for a single text string.
 */
export async function embedText(text: string): Promise<readonly number[]> {
  const client = getOpenAIClient();
  const response = await client.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text,
  });
  return response.data[0].embedding;
}

/**
 * Generate embeddings for multiple texts in batches.
 * Returns embeddings in the same order as the input texts.
 */
export async function embedTexts(
  texts: readonly string[]
): Promise<readonly (readonly number[])[]> {
  const client = getOpenAIClient();
  const allEmbeddings: (readonly number[])[] = [];

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    const response = await client.embeddings.create({
      model: EMBEDDING_MODEL,
      input: batch as string[],
    });

    // Sort by index to ensure order matches input
    const sorted = [...response.data].sort((a, b) => a.index - b.index);
    for (const item of sorted) {
      allEmbeddings.push(item.embedding);
    }
  }

  return allEmbeddings;
}
