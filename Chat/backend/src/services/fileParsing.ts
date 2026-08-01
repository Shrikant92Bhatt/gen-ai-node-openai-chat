import pdfParse from "pdf-parse";

export const SUPPORTED_EXTENSIONS = [".txt", ".md", ".pdf"] as const;

export class UnsupportedFileTypeError extends Error {
  constructor(filename: string) {
    super(
      `Unsupported file type for "${filename}". Supported types: ${SUPPORTED_EXTENSIONS.join(", ")}`
    );
    this.name = "UnsupportedFileTypeError";
  }
}

function getExtension(filename: string): string {
  const dot = filename.lastIndexOf(".");
  return dot === -1 ? "" : filename.slice(dot).toLowerCase();
}

export async function extractText(
  filename: string,
  buffer: Buffer
): Promise<string> {
  const extension = getExtension(filename);

  switch (extension) {
    case ".txt":
    case ".md":
      return buffer.toString("utf-8");
    case ".pdf": {
      const data = await pdfParse(buffer);
      return data.text;
    }
    default:
      throw new UnsupportedFileTypeError(filename);
  }
}
