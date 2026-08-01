import type {
  ApiErrorResponse,
  ChatRequest,
  ChatResponse,
  CollectionsResponse,
  UploadResponse,
} from "./types.ts";

const API_BASE = "/api";

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as ApiErrorResponse | null;
    throw new Error(body?.error ?? `Request failed with status ${response.status}`);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export async function uploadDocument(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE}/upload`, {
    method: "POST",
    body: formData,
  });
  return handleResponse<UploadResponse>(response);
}

export async function sendChatMessage(request: ChatRequest): Promise<ChatResponse> {
  const response = await fetch(`${API_BASE}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  return handleResponse<ChatResponse>(response);
}

export async function listCollections(): Promise<CollectionsResponse> {
  const response = await fetch(`${API_BASE}/collections`);
  return handleResponse<CollectionsResponse>(response);
}

export async function deleteCollection(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/collections/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  return handleResponse<void>(response);
}
