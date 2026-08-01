import type { SourceChunk } from "../lib/types.ts";

export default function SourcesList({ sources }: { sources: SourceChunk[] }) {
  if (sources.length === 0) return null;

  return (
    <details className="mt-2 text-sm">
      <summary className="cursor-pointer text-slate-500 hover:text-slate-700">
        Sources ({sources.length})
      </summary>
      <ul className="mt-2 space-y-2">
        {sources.map((source, i) => (
          <li
            key={`${source.filename}-${source.chunkIndex}-${i}`}
            className="rounded-md border border-slate-200 bg-slate-50 p-2"
          >
            <div className="font-medium text-slate-700">
              {source.filename}{" "}
              <span className="font-normal text-slate-400">
                (chunk {source.chunkIndex})
              </span>
            </div>
            <p className="mt-1 text-slate-600">{source.snippet}</p>
          </li>
        ))}
      </ul>
    </details>
  );
}
