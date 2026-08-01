export interface DocumentSummary {
  id: string;
  filename: string;
  chunkCount: number;
  uploadedAt: string;
}

export interface UploadResponse {
  document: DocumentSummary;
}

export interface ChatRequest {
  question: string;
  sessionId?: string;
}

export interface SourceChunk {
  filename: string;
  chunkIndex: number;
  snippet: string;
}

export interface ChatResponse {
  answer: string;
  sources: SourceChunk[];
}

export interface CollectionsResponse {
  documents: DocumentSummary[];
}

export interface ApiErrorResponse {
  error: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: SourceChunk[];
}
