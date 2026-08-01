import { Router } from "express";
import { listDocuments, deleteDocument } from "../services/chroma.ts";
import type { CollectionsResponse } from "../types.ts";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const documents = await listDocuments();
    const response: CollectionsResponse = { documents };
    res.json(response);
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const filename = decodeURIComponent(req.params.id);
    const deleted = await deleteDocument(filename);

    if (deleted === 0) {
      res.status(404).json({ error: `No document found with id "${filename}".` });
      return;
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
