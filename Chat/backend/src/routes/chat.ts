import { Router } from "express";
import { embedText } from "../services/embeddings.ts";
import { queryChunks } from "../services/chroma.ts";
import { generateAnswer } from "../services/llm.ts";
import type { ChatRequest, ChatResponse } from "../types.ts";

const TOP_K = 4;
const SNIPPET_LENGTH = 240;

const router = Router();

router.post("/", async (req, res, next) => {
  try {
    const body = req.body as Partial<ChatRequest>;
    const question = body.question?.trim();

    if (!question) {
      res.status(400).json({ error: "'question' is required and cannot be empty." });
      return;
    }

    const queryEmbedding = await embedText(question);
    const chunks = await queryChunks(queryEmbedding, TOP_K);
    const answer = await generateAnswer(question, chunks);

    const response: ChatResponse = {
      answer,
      sources: chunks.map((chunk) => ({
        filename: chunk.filename,
        chunkIndex: chunk.chunkIndex,
        snippet:
          chunk.text.length > SNIPPET_LENGTH
            ? `${chunk.text.slice(0, SNIPPET_LENGTH)}...`
            : chunk.text,
      })),
    };
    res.json(response);
  } catch (error) {
    next(error);
  }
});

export default router;
