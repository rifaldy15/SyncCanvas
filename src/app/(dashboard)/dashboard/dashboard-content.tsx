"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { createDocument, deleteDocument } from "@/services/document";
import type { DocumentRow } from "@/services/document";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { DashboardAIPanel } from "@/components/dashboard/DashboardAIPanel";

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

interface DashboardContentProps {
  user: { email: string; fullName: string };
  initialDocuments: DocumentRow[];
}

export function DashboardContent({
  user,
  initialDocuments,
}: DashboardContentProps) {
  const router = useRouter();
  const [documents, setDocuments] = useState(initialDocuments);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleCreate() {
    setCreating(true);
    try {
      const doc = await createDocument();
      router.push(`/editor/${doc.id}`);
    } catch (err) {
      console.error("Failed to create document:", err);
      setCreating(false);
    }
  }

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm("Delete this document?")) return;
    setDeletingId(id);
    try {
      await deleteDocument(id);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      console.error("Failed to delete:", err);
    }
    setDeletingId(null);
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase();

      let title: string;
      let content: string;

      if (
        ext === "txt" ||
        ext === "md" ||
        ext === "markdown" ||
        ext === "text"
      ) {
        content = await file.text();
        title = file.name.replace(/\.(txt|md|markdown|text)$/i, "");
      } else {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/parse-file", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to parse file");
        title = data.title;
        content = data.content;
      }

      const doc = await createDocument(title, content);
      router.push(`/editor/${doc.id}`);
    } catch (err) {
      console.error("Failed to upload:", err);
      alert(err instanceof Error ? err.message : "Failed to upload file.");
      setUploading(false);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  }

  // Filter documents
  const filteredDocs = documents.filter((doc) => {
    const matchesSearch =
      !searchQuery ||
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stripHtml(doc.content).toLowerCase().includes(searchQuery.toLowerCase());

    if (activeTab === "recent") {
      const oneWeek = 7 * 24 * 60 * 60 * 1000;
      return (
        matchesSearch &&
        new Date().getTime() - new Date(doc.updated_at).getTime() < oneWeek
      );
    }

    return matchesSearch;
  });

  const TABS = [
    { id: "all", label: "All Documents", count: documents.length },
    { id: "recent", label: "Recent", count: null },
    { id: "shared", label: "Shared with Me", count: 0 },
    { id: "archived", label: "Archived", count: 0 },
  ];

  // Card thumbnail colors
  const cardColors = [
    "from-brand-600/20 to-brand-400/10",
    "from-accent-600/20 to-accent-400/10",
    "from-blue-600/20 to-blue-400/10",
    "from-emerald-600/20 to-emerald-400/10",
    "from-purple-600/20 to-purple-400/10",
  ];

  const cardIcons = ["📄", "📊", "📋", "📝", "📑"];

  return (
    <div className="min-h-screen bg-surface-950">
      {/* Sidebar */}
      <Sidebar user={user} />

      {/* Main Area — offset by sidebar + AI panel */}
      <div
        className={`lg:ml-60 transition-all duration-300 ${aiPanelOpen ? "lg:mr-80" : ""}`}>
        {/* Top Bar */}
        <header className="sticky top-0 z-30 border-b border-surface-700/50 bg-surface-950/80 backdrop-blur-xl px-4 sm:px-6 py-3 pl-14 lg:pl-6">
          <div className="flex items-center justify-between gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <svg
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Search documents, chats, or..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-surface-700 bg-surface-800/50 py-2 pl-10 pr-4 text-sm text-text-primary placeholder-text-muted outline-none transition-all focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              {/* AI Quick Action */}
              <button
                onClick={() => setAiPanelOpen(!aiPanelOpen)}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold shadow-lg transition-all hover:scale-105 active:scale-95 ${
                  aiPanelOpen
                    ? "bg-brand-600 text-white shadow-brand-500/20"
                    : "border border-surface-700 text-text-secondary hover:border-brand-500/30"
                }`}>
                <span>⚡</span>
                <span className="hidden sm:inline">AI Quick Action</span>
              </button>

              {/* Notification */}
              <button className="relative rounded-xl border border-surface-700 p-2 text-text-secondary transition-all hover:border-brand-500/30 hover:text-text-primary">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                <div className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-surface-950" />
              </button>

              {/* Upload */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.md,.markdown,.text,.docx,.doc,.pdf"
                onChange={handleUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-2 rounded-xl border border-surface-700 px-4 py-2 text-sm font-medium text-text-secondary transition-all hover:border-brand-500/30 hover:text-text-primary disabled:opacity-50">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                  />
                </svg>
                <span className="hidden sm:inline">
                  {uploading ? "Uploading..." : "Upload"}
                </span>
              </button>

              {/* New Document */}
              <button
                onClick={handleCreate}
                disabled={creating}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-accent-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-brand-500/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                <span className="hidden sm:inline">
                  {creating ? "Creating..." : "New Document"}
                </span>
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="px-8 py-6">
          {/* Welcome */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}>
            <h1 className="text-3xl font-bold text-text-primary">
              Workspace Dashboard
            </h1>
            <p className="mt-1 text-sm text-text-secondary">
              Welcome back, {user.fullName || user.email.split("@")[0]}. You
              have {documents.length} document
              {documents.length !== 1 ? "s" : ""}.
            </p>
          </motion.div>

          {/* Tabs */}
          <div className="mt-6 flex items-center gap-1 border-b border-surface-700/50 overflow-x-auto whitespace-nowrap pb-px no-scrollbar">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative px-4 py-2.5 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "text-brand-400"
                    : "text-text-muted hover:text-text-secondary"
                }`}>
                {tab.label}
                {tab.count !== null && tab.count > 0 && (
                  <span className="ml-1.5 text-xs text-text-muted">
                    ({tab.count})
                  </span>
                )}
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-400 rounded-full"
                  />
                )}
              </button>
            ))}
          </div>

          {/* Document Grid */}
          <div className="mt-6">
            {filteredDocs.length === 0 && !searchQuery ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-20 text-center">
                <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-surface-800/50 text-4xl">
                  📝
                </div>
                <h2 className="mb-2 text-xl font-semibold text-text-primary">
                  No documents yet
                </h2>
                <p className="mb-6 max-w-sm text-sm text-text-secondary">
                  Create your first document to start writing and collaborating
                  with AI.
                </p>
                <button
                  onClick={handleCreate}
                  disabled={creating}
                  className="rounded-xl bg-gradient-to-r from-brand-600 to-accent-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:scale-105 active:scale-95">
                  {creating ? "Creating..." : "Create First Document"}
                </button>
              </motion.div>
            ) : filteredDocs.length === 0 && searchQuery ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="mb-4 text-4xl">🔍</div>
                <h2 className="mb-2 text-lg font-semibold text-text-primary">
                  No results found
                </h2>
                <p className="text-sm text-text-secondary">
                  No documents match &ldquo;{searchQuery}&rdquo;
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                <AnimatePresence mode="popLayout">
                  {filteredDocs.map((doc, i) => (
                    <motion.div
                      key={doc.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: i * 0.04, duration: 0.3 }}
                      onClick={() => router.push(`/editor/${doc.id}`)}
                      className="glass group cursor-pointer rounded-2xl overflow-hidden transition-all hover:border-brand-500/30 hover:shadow-lg hover:shadow-brand-500/5 hover:scale-[1.02]">
                      {/* Card Thumbnail */}
                      <div
                        className={`flex h-28 items-center justify-center bg-gradient-to-br ${cardColors[i % cardColors.length]}`}>
                        <span className="text-3xl opacity-60">
                          {cardIcons[i % cardIcons.length]}
                        </span>
                      </div>

                      {/* Card Body */}
                      <div className="p-4">
                        <h3 className="mb-1 font-semibold text-text-primary truncate">
                          {doc.title || "Untitled"}
                        </h3>
                        <p className="mb-3 text-xs text-text-muted line-clamp-2 min-h-8">
                          {doc.content
                            ? (() => {
                                const text = stripHtml(doc.content);
                                return (
                                  text.substring(0, 100) +
                                  (text.length > 100 ? "..." : "")
                                );
                              })()
                            : "Empty document"}
                        </p>

                        {/* Footer */}
                        <div className="flex items-center justify-between text-xs text-text-muted">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px]">EDITED</span>
                            <span className="text-text-secondary font-medium">
                              {formatDate(doc.updated_at)}
                            </span>
                            <div className="h-1.5 w-1.5 rounded-full bg-green-400" />
                          </div>

                          {/* Delete */}
                          <button
                            onClick={(e) => handleDelete(doc.id, e)}
                            disabled={deletingId === doc.id}
                            className="rounded-lg p-1 text-text-muted opacity-0 transition-all hover:bg-red-500/10 hover:text-red-400 group-hover:opacity-100">
                            <svg
                              className="h-3.5 w-3.5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* Create Template Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: filteredDocs.length * 0.04,
                    duration: 0.3,
                  }}
                  onClick={handleCreate}
                  className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-surface-700/50 py-10 transition-all hover:border-brand-500/30 hover:bg-surface-800/20">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border-2 border-surface-600 text-text-muted transition-colors group-hover:border-brand-500">
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                  </div>
                  <h3 className="mb-1 text-sm font-semibold text-text-primary">
                    Create Template
                  </h3>
                  <p className="text-xs text-text-muted text-center max-w-[140px]">
                    Start from a blank canvas or AI prompt
                  </p>
                </motion.div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* AI Panel */}
      {aiPanelOpen && <DashboardAIPanel />}
    </div>
  );
}
