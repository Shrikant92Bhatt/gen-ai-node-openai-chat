import ChatWindow from "./components/ChatWindow.tsx";
import UploadPanel from "./components/UploadPanel.tsx";

export default function App() {
  return (
    <div className="flex h-screen flex-col bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <h1 className="text-lg font-semibold text-slate-800">Chat With Your Data</h1>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-80 shrink-0 border-r border-slate-200 bg-slate-50 p-4">
          <UploadPanel />
        </aside>
        <main className="flex-1 overflow-hidden">
          <ChatWindow />
        </main>
      </div>
    </div>
  );
}
