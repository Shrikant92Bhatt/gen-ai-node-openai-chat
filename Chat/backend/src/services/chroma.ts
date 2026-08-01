import { CloudClient, type Collection } from "chromadb";
import type { ChunkRecord, DocumentSummary } from "../types.ts";

const COLLECTION_NAME = process.env.CHROMA_COLLECTION || "chat_with_your_data";

let client: CloudClient | undefined;
let collectionPromise: Promise<Collection> | undefined;

function getClient(): CloudClient {
  if (!client) client = new CloudClient();
  return client;
}

function getCollection(): Promise<Collection> {
  if (!collectionPromise) {
    collectionPromise = getClient().getOrCreateCollection({
      name: COLLECTION_NAME,
      embeddingFunction: null,
    });
  }
  return collectionPromise;
}

function makeChunkId(filename: string, chunkIndex: number): string {
  return `${encodeURIComponent(filename)}::${chunkIndex}`;
}

export async function addChunks(
  filename: string,
  chunkTexts: string[],
  embeddings: number[][],
  uploadedAt: string
): Promise<void> {
  const collection = await getCollection();

  await collection.upsert({
    ids: chunkTexts.map((_, i) => makeChunkId(filename, i)),
    embeddings,
    documents: chunkTexts,
    metadatas: chunkTexts.map((_, i) => ({
      filename,
      chunkIndex: i,
      uploadedAt,
    })),
  });
}

export async function queryChunks(
  queryEmbedding: number[],
  topK: number
): Promise<ChunkRecord[]> {
  const collection = await getCollection();

  const result = await collection.query({
    queryEmbeddings: [queryEmbedding],
    nResults: topK,
  });

  const ids = result.ids[0] ?? [];
  const documents = result.documents[0] ?? [];
  const metadatas = result.metadatas[0] ?? [];

  return ids.map((id, i) => {
    const metadata = metadatas[i] as Record<string, unknown> | null;
    return {
      id,
      text: documents[i] ?? "",
      filename: (metadata?.filename as string) ?? "unknown",
      chunkIndex: (metadata?.chunkIndex as number) ?? 0,
      uploadedAt: (metadata?.uploadedAt as string) ?? "",
    };
  });
}

export async function listDocuments(): Promise<DocumentSummary[]> {
  const collection = await getCollection();

  const result = await collection.get({ include: ["metadatas"] });
  const metadatas = result.metadatas ?? [];

  const byFilename = new Map<string, DocumentSummary>();
  for (const metadata of metadatas) {
    const meta = metadata as Record<string, unknown> | null;
    if (!meta) continue;
    const filename = meta.filename as string;
    const uploadedAt = (meta.uploadedAt as string) ?? "";

    const existing = byFilename.get(filename);
    if (existing) {
      existing.chunkCount += 1;
      if (uploadedAt < existing.uploadedAt) existing.uploadedAt = uploadedAt;
    } else {
      byFilename.set(filename, {
        id: filename,
        filename,
        chunkCount: 1,
        uploadedAt,
      });
    }
  }

  return Array.from(byFilename.values()).sort((a, b) =>
    b.uploadedAt.localeCompare(a.uploadedAt)
  );
}

export async function deleteDocument(filename: string): Promise<number> {
  const collection = await getCollection();
  const result = await collection.delete({ where: { filename } });
  return result.deleted ?? 0;
}
