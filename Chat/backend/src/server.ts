import express, { type ErrorRequestHandler } from "express";
import cors from "cors";
import { MulterError } from "multer";
import uploadRouter from "./routes/upload.ts";
import chatRouter from "./routes/chat.ts";
import collectionsRouter from "./routes/collections.ts";

const REQUIRED_ENV_VARS = ["OPENAI_API_KEY", "CHROMA_API_KEY"] as const;

for (const key of REQUIRED_ENV_VARS) {
  if (!process.env[key]) {
    console.error(`Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/upload", uploadRouter);
app.use("/api/chat", chatRouter);
app.use("/api/collections", collectionsRouter);

const errorHandler: ErrorRequestHandler = (error, req, res, next) => {
  if (error instanceof MulterError) {
    res.status(400).json({ error: `File upload error: ${error.message}` });
    return;
  }

  console.error(error);
  const message = error instanceof Error ? error.message : "Internal server error";
  res.status(500).json({ error: message });
};
app.use(errorHandler);

const PORT = Number(process.env.PORT) || 3001;

app.listen(PORT, () => {
  console.log(`Chat RAG backend listening on http://localhost:${PORT}`);
});
