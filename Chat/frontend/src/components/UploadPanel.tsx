import { useCallback, useEffect, useRef, useState } from "react";
import { deleteCollection, listCollections, uploadDocument } from "../lib/apiClient.ts";
import type { DocumentSummary } from "../lib/types.ts";

export default function UploadPanel() {
  const [documents, setDocuments] = useState<DocumentSummary[]>([]);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(true);
  const [uploadingFiles, setUploadingFiles] = useState<Record<string, boolean>>({});
  const [deletingIds, setDeletingIds] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refreshDocuments = useCallback(async () => {
    try {
      const { documents } = await listCollections();
      setDocuments(documents);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load documents.");
    } finally {
      setIsLoadingDocuments(false);
    }
  }, []);

  useEffect(() => {
    refreshDocuments();
  }, [refreshDocuments]);

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      setError(null);
      for (const file of Array.from(files)) {
        setUploadingFiles((prev) => ({ ...prev, [file.name]: true }));
        try {
          await uploadDocument(file);
          await refreshDocuments();
        } catch (err) {
          setError(err instanceof Error ? err.message : `Failed to upload "${file.name}".`);
        } finally {
          setUploadingFiles((prev) => {
            const next = { ...prev };
            delete next[file.name];
            return next;
          });
        }
      }
    },
    [refreshDocuments]
  );

  const handleDelete = useCallback(async (id: string) => {
    setDeletingIds((prev) => ({ ...prev, [id]: true }));
    setError(null);
    try {
      await deleteCollection(id);
      setDocuments((prev) => prev.filter((doc) => doc.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to delete "${id}".`);
    } finally {
      setDeletingIds((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  }, []);

  const uploadingCount = Object.keys(uploadingFiles).length;

  return (
    <div className="flex h-full flex-col gap-4">
      <div
        role="button"
        tabIndex={0}
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
        }}
        className={`cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
          isDragging ? "border-indigo-500 bg-indigo-50" : "border-slate-300 bg-white"
        }`}
      >
        <p className="text-sm text-slate-600">
          Drag & drop a file here, or click to browse
        </p>
        <p className="mt-1 text-xs text-slate-400">.txt, .md, .pdf</p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.md,.pdf"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {uploadingCount > 0 && (
        <p className="text-sm text-indigo-600">
          Uploading {uploadingCount} file{uploadingCount > 1 ? "s" : ""}...
        </p>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex-1 overflow-y-auto">
        <h2 className="mb-2 text-sm font-semibold text-slate-500">
          Indexed documents
        </h2>
        {isLoadingDocuments ? (
          <p className="text-sm text-slate-400">Loading...</p>
        ) : documents.length === 0 ? (
          <p className="text-sm text-slate-400">No documents uploaded yet.</p>
        ) : (
          <ul className="space-y-2">
            {documents.map((doc) => (
              <li
                key={doc.id}
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-700">{doc.filename}</p>
                  <p className="text-xs text-slate-400">{doc.chunkCount} chunks</p>
                </div>
                <button
                  onClick={() => handleDelete(doc.id)}
                  disabled={deletingIds[doc.id]}
                  className="ml-2 shrink-0 rounded-md px-2 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  {deletingIds[doc.id] ? "Deleting..." : "Delete"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
