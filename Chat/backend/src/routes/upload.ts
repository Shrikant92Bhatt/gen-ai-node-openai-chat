import { Router } from "express";
import multer from "multer";
import { chunkText } from "../services/chunking.ts";
import { embedTexts } from "../services/embeddings.ts";
import { addChunks } from "../services/chroma.ts";
import { extractText, UnsupportedFileTypeError } from "../services/fileParsing.ts";
import type { UploadResponse } from "../types.ts";

const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
});

const router = Router();

router.post("/", upload.single("file"), async (req, res, next) => {
  try {
    const file = req.file;
    if (!file) {
      res.status(400).json({ error: "No file provided. Attach a file under the 'file' field." });
      return;
    }

    const text = await extractText(file.originalname, file.buffer);
    if (!text.trim()) {
      res.status(400).json({ error: `No extractable text found in "${file.originalname}".` });
      return;
    }

    const chunks = chunkText(text);
    if (chunks.length === 0) {
      res.status(400).json({ error: `Document produced no chunks after processing.` });
      return;
    }

    const embeddings = await embedTexts(chunks);
    const uploadedAt = new Date().toISOString();

    await addChunks(file.originalname, chunks, embeddings, uploadedAt);

    const response: UploadResponse = {
      document: {
        id: file.originalname,
        filename: file.originalname,
        chunkCount: chunks.length,
        uploadedAt,
      },
    };
    res.status(201).json(response);
  } catch (error) {
    if (error instanceof UnsupportedFileTypeError) {
      res.status(400).json({ error: error.message });
      return;
    }
    next(error);
  }
});

export default router;
