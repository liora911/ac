/**
 * Embedding utilities for semantic search
 * Uses Google's text-embedding-004 model (free tier available)
 */

const GOOGLE_API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
const EMBEDDING_MODEL = "text-embedding-004";
const EMBEDDING_DIMENSION = 768; // text-embedding-004 outputs 768 dimensions

interface EmbeddingResponse {
  embedding: {
    values: number[];
  };
}

interface GoogleEmbeddingAPIResponse {
  embedding: {
    values: number[];
  };
}

/**
 * Generate embedding for a single text using Google's embedding API
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  if (!GOOGLE_API_KEY) {
    throw new Error("GOOGLE_GENERATIVE_AI_API_KEY is not set");
  }

  // Clean and truncate text (model has token limits)
  const cleanedText = cleanTextForEmbedding(text);

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${EMBEDDING_MODEL}:embedContent?key=${GOOGLE_API_KEY}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: `models/${EMBEDDING_MODEL}`,
        content: {
          parts: [{ text: cleanedText }],
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Embedding API error: ${response.status} - ${error}`);
  }

  const data: GoogleEmbeddingAPIResponse = await response.json();
  return data.embedding.values;
}

/**
 * Generate embeddings for multiple texts in batch
 */
export async function generateEmbeddings(
  texts: string[]
): Promise<number[][]> {
  // Process in parallel with rate limiting (10 concurrent requests)
  const batchSize = 10;
  const results: number[][] = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map((text) => generateEmbedding(text))
    );
    results.push(...batchResults);
  }

  return results;
}

/**
 * Clean text for embedding - remove HTML, normalize whitespace, truncate
 */
export function cleanTextForEmbedding(text: string): string {
  // Remove HTML tags
  let cleaned = text.replace(/<[^>]*>/g, " ");

  // Decode HTML entities
  cleaned = cleaned
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  // Normalize whitespace
  cleaned = cleaned.replace(/\s+/g, " ").trim();

  // Truncate to ~8000 characters (roughly 2000 tokens, well under model limit)
  if (cleaned.length > 8000) {
    cleaned = cleaned.substring(0, 8000);
  }

  return cleaned;
}

/**
 * Prepare article content for embedding
 * Combines title, subtitle, and content for comprehensive semantic representation
 */
export function prepareArticleForEmbedding(article: {
  title: string;
  subtitle?: string | null;
  content: string;
  tags?: { tag: { name: string } }[] | { name: string }[];
}): string {
  const parts: string[] = [];

  // Title is most important
  parts.push(`Title: ${article.title}`);

  // Subtitle provides context
  if (article.subtitle) {
    parts.push(`Subtitle: ${article.subtitle}`);
  }

  // Tags help with topic matching
  if (article.tags && article.tags.length > 0) {
    const tagNames = article.tags.map((t) =>
      "tag" in t ? t.tag.name : t.name
    );
    parts.push(`Topics: ${tagNames.join(", ")}`);
  }

  // Content is the main body
  parts.push(`Content: ${cleanTextForEmbedding(article.content)}`);

  return parts.join("\n\n");
}

/**
 * Calculate cosine similarity between two vectors
 * Returns a value between -1 and 1, where 1 means identical
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error("Vectors must have same length");
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Find most similar articles based on embedding similarity
 */
export function findSimilarByEmbedding(
  queryEmbedding: number[],
  articles: { id: string; embedding: number[] | null }[],
  topK: number = 5,
  minSimilarity: number = 0.3
): { id: string; similarity: number }[] {
  const scored = articles
    .filter((a) => a.embedding && a.embedding.length > 0)
    .map((article) => ({
      id: article.id,
      similarity: cosineSimilarity(queryEmbedding, article.embedding!),
    }))
    .filter((a) => a.similarity >= minSimilarity)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK);

  return scored;
}

export { EMBEDDING_MODEL, EMBEDDING_DIMENSION };
