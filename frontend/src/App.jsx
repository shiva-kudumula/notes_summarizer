import { useEffect, useState } from "react";
import Login from "./Login";
import Dashboard from "./Dashboard";
import FileUpload from "./FileUpload";
import { api } from "./api";

export default function App() {
  const [page, setPage] = useState("loading");
  const [selectedSourceId, setSelectedSourceId] = useState(null);
  useEffect(() => {
    if (!localStorage.getItem("token")) return setPage("login");
    api("/auth/me").then(() => setPage("dashboard")).catch(() => { localStorage.removeItem("token"); setPage("login"); });
  }, []);
  if (page === "loading") return <p className="app-loading">Loading NotesGenie…</p>;
  if (page === "login") return <Login onLogin={() => setPage("dashboard")} />;
  if (page === "dashboard") return <Dashboard onAddSource={() => { setSelectedSourceId(null); setPage("source"); }} onOpenSource={(id) => { setSelectedSourceId(id); setPage("source"); }} />;
  return <FileUpload selectedSourceId={selectedSourceId} onBack={() => setPage("dashboard")} onSourceAdded={(id) => { setSelectedSourceId(id); setPage("source"); }} />;
}
