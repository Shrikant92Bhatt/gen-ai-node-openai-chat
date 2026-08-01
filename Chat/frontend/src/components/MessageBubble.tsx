import type { ChatMessage } from "../lib/types.ts";
import SourcesList from "./SourcesList.tsx";

export default function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-2xl rounded-2xl px-4 py-2.5 ${
          isUser
            ? "bg-indigo-600 text-white"
            : "bg-white text-slate-800 border border-slate-200"
        }`}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
        {!isUser && message.sources && <SourcesList sources={message.sources} />}
      </div>
    </div>
  );
}
