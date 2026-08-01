# Chat With Your Data

A Retrieval-Augmented Generation (RAG) app: upload documents, then ask questions answered using semantic search over your documents + LLM context injection.

```
INGESTION:
  Document -> Chunk text -> Generate embeddings -> Store in ChromaDB

QUERY:
  User question -> Embed question -> Similarity search in ChromaDB
  -> Retrieve top-k relevant chunks -> Inject as context into LLM prompt
  -> LLM generates grounded answer -> Return to UI
```

## Stack

- **Frontend**: React + TypeScript (Vite), Tailwind CSS
- **Backend**: Node.js + TypeScript, Express
- **Vector DB**: [ChromaDB](https://www.trychroma.com/) (Chroma Cloud)
- **Embeddings**: OpenAI `text-embedding-3-small`
- **LLM**: OpenAI `gpt-4o-mini`

## Project structure

```
/backend
  /src
    /routes    upload.ts, chat.ts, collections.ts — HTTP layer only
    /services  chunking.ts, embeddings.ts, chroma.ts, llm.ts, fileParsing.ts
    types.ts   shared request/response types
    server.ts  Express app entrypoint
/frontend
  /src
    /components ChatWindow, MessageBubble, UploadPanel, SourcesList
    /lib        apiClient.ts (typed fetch wrapper), types.ts
    App.tsx
```

## Prerequisites

- Node.js 22.6+ (uses Node's native TypeScript execution — no ts-node/tsx needed for `npm run dev`/`npm start`)
- An [OpenAI API key](https://platform.openai.com/api-keys)
- A [Chroma Cloud](https://www.trychroma.com/) account (API key, tenant, and database name)

## Setup

### Backend

```bash
cd backend
npm install
cp .env.example .env
```

Fill in `.env`:

```
OPENAI_API_KEY=sk-...
CHROMA_API_KEY=ck-...
CHROMA_TENANT=your-tenant-id
CHROMA_DATABASE=your-database-name
CHROMA_COLLECTION=chat_with_your_data
PORT=3001
```

Run it:

```bash
npm run dev     # watch mode
npm start       # single run
npm run build   # type-check + emit to dist/
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Opens on `http://localhost:5173`. The Vite dev server proxies `/api/*` requests to the backend on `http://localhost:3001` (see `vite.config.ts`), so no CORS setup is needed in development.

## How ChromaDB is connected

The backend uses the `chromadb` npm package's `CloudClient`, which authenticates against Chroma Cloud using `CHROMA_API_KEY` (sent as the `x-chroma-token` header) plus `CHROMA_TENANT` and `CHROMA_DATABASE` — all read from environment variables, never hardcoded (`backend/src/services/chroma.ts`).

All uploaded documents share a single Chroma collection (name configurable via `CHROMA_COLLECTION`). Each chunk is stored as one record:

- `id`: `<url-encoded filename>::<chunk index>`
- `embedding`: pre-computed via OpenAI (the collection has no embedding function of its own — embeddings are always supplied explicitly on add/query)
- `document`: the chunk's text
- `metadata`: `{ filename, chunkIndex, uploadedAt }`

A logical "document" in the UI is just every chunk sharing the same `filename` metadata field — `GET /api/collections` groups by it, and `DELETE /api/collections/:id` deletes every chunk matching `where: { filename: id }`.

## API

| Method | Path                     | Description                                                        |
| ------ | ------------------------ | -------------------------------------------------------------------|
| POST   | `/api/upload`             | Multipart upload (`file` field). Extracts, chunks, embeds, stores. |
| POST   | `/api/chat`                | `{ question, sessionId? }` → `{ answer, sources[] }`               |
| GET    | `/api/collections`         | List indexed documents with chunk counts.                          |
| DELETE | `/api/collections/:id`     | Remove a document (id = filename) and its chunks.                  |

Supported upload types: `.txt`, `.md`, `.pdf`.

Chunking: ~700 tokens per chunk (tiktoken `cl100k_base`) with 100-token overlap, configurable in `backend/src/services/chunking.ts`.

## Notes

- No auth, no multi-user support, no database beyond ChromaDB — by design, for a single-user local tool.
- All documents live in one physical Chroma collection; "documents" in the UI are a metadata-based grouping, not separate Chroma collections, to keep collection management simple.
