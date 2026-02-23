"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { createDocument, deleteDocument } from "@/services/document";
import type { DocumentRow } from "@/services/document";
import { Sidebar } from "@/components/dashboard/Sidebar";

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

interface DocumentsContentProps {
  user: { email: string; fullName: string };
  initialDocuments: DocumentRow[];
}

export function DocumentsContent({
  user,
  initialDocuments,
}: DocumentsContentProps) {
  const router = useRouter();
  const [documents, setDocuments] = useState(initialDocuments);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [selectedDoc, setSelectedDoc] = useState<DocumentRow | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"updated" | "title" | "created">(
    "updated",
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleCreate() {
    setCreating(true);
    try {
      const doc = await createDocument();
      router.push(`/editor/${doc.id}`);
    } catch (err) {
      console.error("Failed to create:", err);
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this document?")) return;
    setDeletingId(id);
    try {
      await deleteDocument(id);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
      if (selectedDoc?.id === id) setSelectedDoc(null);
    } catch (err) {
      console.error("Failed to delete:", err);
    }
    setDeletingId(null);
    setMenuOpenId(null);
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase();
      let title: string, content: string;
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
    if (diffMins < 60) return `${diffMins} minutes ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24)
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  }

  // Filter + sort
  const filteredDocs = documents
    .filter((doc) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        doc.title.toLowerCase().includes(q) ||
        stripHtml(doc.content).toLowerCase().includes(q);
      return matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === "title") return a.title.localeCompare(b.title);
      if (sortBy === "created")
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      return (
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
    });

  const docIcons = ["🚀", "📐", "📊", "🤖", "📝", "📋", "💡", "🎯"];

  function getWordCount(text: string) {
    return text.trim() ? text.trim().split(/\s+/).length : 0;
  }

  return (
    <div className="min-h-screen bg-surface-950">
      <Sidebar user={user} />

      {/* Main */}
      <div
        className={`lg:ml-60 transition-all duration-300 ${selectedDoc ? "lg:mr-80" : ""}`}>
        {/* Top bar */}
        <header className="sticky top-0 z-30 border-b border-surface-700/50 bg-surface-950/80 backdrop-blur-xl px-4 sm:px-6 py-3 pl-14 lg:pl-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
              <h1 className="text-xl font-bold text-text-primary">Documents</h1>

              {/* Search */}
              <div className="relative flex-1 sm:flex-none">
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
                  placeholder="Search in Documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full sm:w-64 rounded-xl border border-surface-700 bg-surface-800/50 py-2 pl-10 pr-4 text-sm text-text-primary placeholder-text-muted outline-none transition-all focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                />
              </div>

              {/* View Toggle */}
              <div className="hidden sm:flex rounded-lg border border-surface-700 overflow-hidden">
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 transition-colors ${viewMode === "list" ? "bg-surface-700 text-text-primary" : "text-text-muted hover:text-text-secondary"}`}>
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 transition-colors ${viewMode === "grid" ? "bg-surface-700 text-text-primary" : "text-text-muted hover:text-text-secondary"}`}>
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
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
                {uploading ? "Uploading..." : "Upload"}
              </button>
              <button
                onClick={handleCreate}
                disabled={creating}
                className="flex items-center gap-1 sm:gap-2 rounded-xl bg-linear-to-r from-brand-600 to-accent-600 px-3 sm:px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-brand-500/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50">
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
                {creating ? "Creating..." : "New Document"}
              </button>
            </div>
          </div>
        </header>

        <main className="px-6 py-5">
          {/* Sort */}
          <div className="mb-5 flex items-center justify-between">
            <p className="text-sm text-text-secondary">
              {filteredDocs.length} document
              {filteredDocs.length !== 1 ? "s" : ""}
            </p>

            <div className="flex items-center gap-2">
              <span className="text-xs text-text-muted">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="rounded-lg border border-surface-700 bg-surface-800/50 px-3 py-1.5 text-xs text-text-secondary outline-none focus:border-brand-500">
                <option value="updated">Last Edited</option>
                <option value="created">Date Created</option>
                <option value="title">Title A-Z</option>
              </select>
            </div>
          </div>

          {/* List View */}
          {viewMode === "list" ? (
            <div className="rounded-2xl border border-surface-700/50 overflow-hidden">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-2 sm:gap-4 border-b border-surface-700/50 bg-surface-900/50 px-3 sm:px-5 py-3 text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-text-muted">
                <div className="col-span-10 sm:col-span-7 lg:col-span-5">
                  Document Name
                </div>
                <div className="hidden lg:block lg:col-span-2">Owner</div>
                <div className="hidden sm:block sm:col-span-3 lg:col-span-2">
                  Last Edited
                </div>
                <div className="hidden lg:block lg:col-span-2">Status</div>
                <div className="col-span-2 sm:col-span-2 lg:col-span-1 text-right">
                  Actions
                </div>
              </div>

              {/* Rows */}
              <AnimatePresence mode="popLayout">
                {filteredDocs.map((doc, i) => (
                  <motion.div
                    key={doc.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => setSelectedDoc(doc)}
                    className={`grid grid-cols-12 gap-2 sm:gap-4 items-center px-3 sm:px-5 py-4 cursor-pointer transition-all border-b border-surface-700/20 hover:bg-surface-800/30 ${
                      selectedDoc?.id === doc.id
                        ? "bg-brand-600/5 border-l-2 border-l-brand-500"
                        : ""
                    }`}>
                    {/* Name */}
                    <div className="col-span-10 sm:col-span-7 lg:col-span-5 flex items-center gap-2 sm:gap-3">
                      <div className="flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-surface-800 text-sm sm:text-lg">
                        {docIcons[i % docIcons.length]}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-text-primary truncate">
                          {doc.title || "Untitled"}
                        </p>
                        <p className="text-xs text-text-muted truncate">
                          {doc.content
                            ? (() => {
                                const t = stripHtml(doc.content);
                                return (
                                  t.substring(0, 60) +
                                  (t.length > 60 ? "..." : "")
                                );
                              })()
                            : "Empty document"}
                        </p>
                      </div>
                    </div>

                    {/* Owner */}
                    <div className="hidden lg:flex lg:col-span-2 items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-accent-500 text-[10px] font-bold text-white">
                        {(user.fullName || user.email).charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm text-text-secondary">You</span>
                    </div>

                    {/* Last Edited */}
                    <div className="hidden sm:block sm:col-span-3 lg:col-span-2 flex-col justify-center text-xs sm:text-sm text-text-secondary">
                      {formatDate(doc.updated_at)}
                    </div>

                    {/* Status */}
                    <div className="hidden lg:block lg:col-span-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-800 px-2.5 py-1 text-xs text-text-muted">
                        <div className="h-1.5 w-1.5 rounded-full bg-green-400" />
                        Private
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="col-span-2 sm:col-span-2 lg:col-span-1 flex items-center justify-end gap-2 relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuOpenId(menuOpenId === doc.id ? null : doc.id);
                        }}
                        className="rounded-lg p-1.5 text-text-muted hover:bg-surface-700 hover:text-text-primary transition-colors">
                        <svg
                          className="h-4 w-4"
                          fill="currentColor"
                          viewBox="0 0 24 24">
                          <circle cx="12" cy="5" r="1.5" />
                          <circle cx="12" cy="12" r="1.5" />
                          <circle cx="12" cy="19" r="1.5" />
                        </svg>
                      </button>

                      {menuOpenId === doc.id && (
                        <div className="absolute right-0 top-8 z-50 w-36 rounded-xl border border-surface-700 bg-surface-900 py-1 shadow-xl">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/editor/${doc.id}`);
                            }}
                            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:bg-surface-800 hover:text-text-primary">
                            ✏️ Open
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(doc.id);
                            }}
                            disabled={deletingId === doc.id}
                            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10">
                            🗑️ Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {filteredDocs.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="mb-4 text-4xl">
                    {searchQuery ? "🔍" : "📝"}
                  </div>
                  <h2 className="mb-2 text-lg font-semibold text-text-primary">
                    {searchQuery ? "No results found" : "No documents yet"}
                  </h2>
                  <p className="text-sm text-text-secondary">
                    {searchQuery
                      ? `No documents match "${searchQuery}"`
                      : "Create your first document to get started."}
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* Grid View */
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredDocs.map((doc, i) => (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => {
                    setSelectedDoc(doc);
                    router.push(`/editor/${doc.id}`);
                  }}
                  className="glass group cursor-pointer rounded-2xl overflow-hidden transition-all hover:border-brand-500/30 hover:shadow-lg hover:scale-[1.02]">
                  <div className="flex h-24 items-center justify-center bg-gradient-to-br from-brand-600/20 to-accent-400/10">
                    <span className="text-3xl opacity-60">
                      {docIcons[i % docIcons.length]}
                    </span>
                  </div>
                  <div className="p-4">
                    <h3 className="mb-1 font-semibold text-text-primary truncate">
                      {doc.title || "Untitled"}
                    </h3>
                    <p className="mb-2 text-xs text-text-muted line-clamp-2">
                      {doc.content
                        ? (() => {
                            const t = stripHtml(doc.content);
                            return (
                              t.substring(0, 80) + (t.length > 80 ? "..." : "")
                            );
                          })()
                        : "Empty document"}
                    </p>
                    <p className="text-xs text-text-muted">
                      {formatDate(doc.updated_at)}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* File Details Sidebar */}
      <AnimatePresence>
        {selectedDoc && (
          <motion.aside
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed top-0 right-0 bottom-0 z-30 w-80 border-l border-surface-700/50 bg-surface-950 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-surface-700/50 px-5 py-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-text-muted">
                File Details
              </h2>
              <button
                onClick={() => setSelectedDoc(null)}
                className="rounded-lg p-1 text-text-muted hover:text-text-primary hover:bg-surface-800 transition-colors">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Preview */}
            <div className="p-5 space-y-5 overflow-y-auto flex-1">
              <div className="flex h-32 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600/20 to-accent-400/10">
                <span className="text-5xl opacity-50">📄</span>
              </div>

              <div>
                <h3 className="text-lg font-bold text-text-primary">
                  {selectedDoc.title || "Untitled"}
                </h3>
                <p className="mt-1 text-xs text-text-muted">
                  Last edited {formatDate(selectedDoc.updated_at)}
                </p>
              </div>

              {/* Metadata */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-surface-700/50 bg-surface-800/30 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                    Words
                  </p>
                  <p className="mt-1 text-lg font-bold text-text-primary">
                    {getWordCount(
                      stripHtml(selectedDoc.content),
                    ).toLocaleString()}
                  </p>
                </div>
                <div className="rounded-xl border border-surface-700/50 bg-surface-800/30 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                    Created
                  </p>
                  <p className="mt-1 text-sm font-semibold text-text-primary">
                    {new Date(selectedDoc.created_at).toLocaleDateString(
                      "en-US",
                      { month: "short", day: "numeric", year: "numeric" },
                    )}
                  </p>
                </div>
                <div className="rounded-xl border border-surface-700/50 bg-surface-800/30 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                    Type
                  </p>
                  <p className="mt-1 text-sm font-semibold text-text-primary">
                    Sync Canvas
                  </p>
                </div>
                <div className="rounded-xl border border-surface-700/50 bg-surface-800/30 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                    Storage
                  </p>
                  <p className="mt-1 text-sm font-semibold text-text-primary">
                    Supabase
                  </p>
                </div>
              </div>

              {/* Owner */}
              <div>
                <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-muted">
                  Owner
                </h4>
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-accent-500 text-xs font-bold text-white">
                    {(user.fullName || user.email).charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">
                      {user.fullName || user.email}
                    </p>
                    <p className="text-xs text-text-muted">
                      Edited {formatDate(selectedDoc.updated_at)}
                    </p>
                  </div>
                  <div className="ml-auto h-2.5 w-2.5 rounded-full bg-green-400" />
                </div>
              </div>
            </div>

            {/* AI Summarize */}
            <div className="border-t border-surface-700/50 p-4">
              <button
                onClick={() => router.push(`/editor/${selectedDoc.id}`)}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-500/20 transition-all hover:bg-brand-500 hover:scale-[1.02] active:scale-95">
                🤖 AI Summarize Document
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
}
