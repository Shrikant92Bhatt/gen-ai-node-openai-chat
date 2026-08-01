import { get_encoding } from "tiktoken";

const ENCODING_NAME = "cl100k_base";
const CHUNK_SIZE_TOKENS = 700;
const CHUNK_OVERLAP_TOKENS = 100;

export function chunkText(
  text: string,
  chunkSizeTokens: number = CHUNK_SIZE_TOKENS,
  overlapTokens: number = CHUNK_OVERLAP_TOKENS
): string[] {
  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];

  const encoding = get_encoding(ENCODING_NAME);
  try {
    const tokens = encoding.encode(normalized);
    if (tokens.length === 0) return [];

    const chunks: string[] = [];
    const stride = chunkSizeTokens - overlapTokens;
    for (let start = 0; start < tokens.length; start += stride) {
      const end = Math.min(start + chunkSizeTokens, tokens.length);
      const slice = tokens.slice(start, end);
      const chunk = new TextDecoder().decode(encoding.decode(slice)).trim();
      if (chunk) chunks.push(chunk);
      if (end === tokens.length) break;
    }
    return chunks;
  } finally {
    encoding.free();
  }
}
