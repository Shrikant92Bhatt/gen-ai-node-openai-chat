import OpenAI from "openai";
import type { ChunkRecord } from "../types.ts";

const CHAT_MODEL = "gpt-4o-mini";

let client: OpenAI | undefined;

function getClient(): OpenAI {
  if (!client) client = new OpenAI();
  return client;
}

const SYSTEM_PROMPT = `You are a helpful assistant answering questions using only the provided context excerpts from the user's uploaded documents.
- Base your answer strictly on the context below. Do not use outside knowledge.
- If the context does not contain enough information to answer, say so clearly instead of guessing.
- Be concise and direct.`;

function buildContextBlock(chunks: ChunkRecord[]): string {
  return chunks
    .map(
      (chunk, i) =>
        `[${i + 1}] Source: ${chunk.filename} (chunk ${chunk.chunkIndex})\n${chunk.text}`
    )
    .join("\n\n");
}

export async function generateAnswer(
  question: string,
  contextChunks: ChunkRecord[]
): Promise<string> {
  const openai = getClient();

  const contextBlock = contextChunks.length
    ? buildContextBlock(contextChunks)
    : "No relevant context was found in the uploaded documents.";

  const response = await openai.chat.completions.create({
    model: CHAT_MODEL,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `Context:\n${contextBlock}\n\nQuestion: ${question}`,
      },
    ],
    temperature: 0.2,
  });

  return response.choices[0]?.message?.content?.trim() ?? "";
}
