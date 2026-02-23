"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useToast } from "@/components/ui/Toast";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import Highlight from "@tiptap/extension-highlight";
import Color from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import Placeholder from "@tiptap/extension-placeholder";
import { updateDocument } from "@/services/document";
import { CollaborationBar } from "./CollaborationBar";
import { AIChatPanel } from "@/components/ai/AIChatPanel";
import { EditorToolbar } from "./EditorToolbar";
import { SlashCommandMenu } from "./SlashCommandMenu";
import { FloatingToolbar } from "./FloatingToolbar";
import { RemoteCursors, updateRemoteCursors } from "./extensions/RemoteCursors";
import { useRealtimeDocument } from "@/hooks/useRealtimeDocument";
import type { DocumentRow } from "@/services/document";

interface DocumentEditorProps {
  document: DocumentRow;
  userId: string;
  userEmail: string;
  userName: string;
}

export function DocumentEditor({
  document,
  userId,
  userEmail,
  userName,
}: DocumentEditorProps) {
  const [title, setTitle] = useState(document.title);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [aiOpen, setAiOpen] = useState(false);
  const saveTimeout = useRef<NodeJS.Timeout | null>(null);
  const { showToast } = useToast();

  // Ctrl+K to toggle AI
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setAiOpen((prev) => !prev);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Listen for "Ask Gemini" from floating toolbar
  useEffect(() => {
    function handleAskGemini(e: Event) {
      const detail = (e as CustomEvent).detail;
      if (detail?.text) {
        setAiOpen(true);
      }
    }
    window.addEventListener("ask-gemini", handleAskGemini);
    return () => window.removeEventListener("ask-gemini", handleAskGemini);
  }, []);

  // Realtime collab
  const { onlineUsers, remoteCursors, broadcastChange, broadcastCursor } =
    useRealtimeDocument({
      documentId: document.id,
      userId,
      userName,
      userEmail,
    });

  // Auto-save with debounce
  const saveChanges = useCallback(
    async (newTitle: string, newContent: string) => {
      setSaving(true);
      try {
        await updateDocument(document.id, {
          title: newTitle,
          content: newContent,
        });
        setLastSaved(new Date());
        showToast("Auto-saved", "success", "💾");
      } catch (err) {
        console.error("Save failed:", err);
        showToast("Save failed", "error");
      }
      setSaving(false);
    },
    [document.id],
  );

  const debouncedSave = useCallback(
    (newTitle: string, newContent: string) => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      saveTimeout.current = setTimeout(() => {
        saveChanges(newTitle, newContent);
      }, 1500);
    },
    [saveChanges],
  );

  // Determine initial content: if it starts with <, it's HTML; otherwise wrap plain text
  const initialContent = document.content.startsWith("<")
    ? document.content
    : document.content
      ? `<p>${document.content.split("\n").join("</p><p>")}</p>`
      : "<p></p>";

  // TipTap Editor
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      Highlight.configure({ multicolor: true }),
      Color,
      TextStyle,
      Placeholder.configure({
        placeholder:
          "Start writing... Use the toolbar above to format your document",
      }),
      RemoteCursors,
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class: "tiptap-editor outline-none min-h-[60vh] prose-editor",
      },
    },
    onUpdate: ({ editor: ed }) => {
      const html = ed.getHTML();
      broadcastChange({ title, content: html });
      debouncedSave(title, html);
    },
    onSelectionUpdate: ({ editor: ed }) => {
      broadcastCursor(ed.state.selection.head);
    },
  });

  // Sync incoming remote cursors visually
  useEffect(() => {
    if (editor && remoteCursors.length > 0) {
      updateRemoteCursors(editor, remoteCursors);
    }
  }, [remoteCursors, editor]);

  function handleTitleChange(newTitle: string) {
    setTitle(newTitle);
    const html = editor?.getHTML() || "";
    broadcastChange({ title: newTitle, content: html });
    debouncedSave(newTitle, html);
  }

  // Word/char count from text content
  const textContent = editor?.getText() || "";
  const wordCount = textContent.trim()
    ? textContent.trim().split(/\s+/).length
    : 0;
  const charCount = textContent.length;

  return (
    <div className="min-h-screen bg-surface-950">
      {/* Top Bar */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass fixed top-0 left-0 right-0 z-50 px-4 py-3">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm text-text-secondary transition-colors hover:text-text-primary hover:bg-surface-800/50">
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Dashboard
            </Link>
            <div className="h-4 w-px bg-surface-700" />
            <div className="flex items-center gap-2 text-xs text-text-muted">
              {saving ? (
                <>
                  <div className="h-2 w-2 rounded-full bg-yellow-400 animate-pulse" />
                  Saving...
                </>
              ) : lastSaved ? (
                <>
                  <div className="h-2 w-2 rounded-full bg-green-400" />
                  Saved
                </>
              ) : (
                <>
                  <div className="h-2 w-2 rounded-full bg-surface-600" />
                  No changes
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setAiOpen(!aiOpen)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                aiOpen
                  ? "bg-gradient-to-r from-accent-600 to-brand-600 text-white shadow-lg shadow-accent-500/20"
                  : "text-text-secondary hover:text-text-primary hover:bg-surface-800/50"
              }`}>
              🤖 AI
              <kbd className="hidden sm:inline rounded bg-surface-700/50 px-1 py-0.5 text-[10px] font-mono">
                ⌘K
              </kbd>
            </button>
            <CollaborationBar onlineUsers={onlineUsers} />
          </div>
        </div>
      </motion.header>

      {/* Toolbar — below top bar */}
      <div className="fixed top-[52px] left-0 right-0 z-40">
        <div className="mx-auto max-w-5xl">
          <EditorToolbar editor={editor} />
        </div>
      </div>

      {/* Editor */}
      <main className="mx-auto max-w-3xl px-6 pt-28 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}>
          {/* Title */}
          <input
            type="text"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Untitled"
            className="mb-6 w-full bg-transparent text-4xl font-bold text-text-primary placeholder-surface-700 outline-none"
          />

          {/* Rich Text Editor */}
          <div className="relative">
            <EditorContent editor={editor} />
            <SlashCommandMenu editor={editor} />
            <FloatingToolbar editor={editor} />
          </div>
        </motion.div>
      </main>

      {/* Bottom Bar */}
      <div className="glass fixed bottom-0 left-0 right-0 px-6 py-2">
        <div className="mx-auto flex max-w-3xl items-center justify-between text-xs text-text-muted">
          <div className="flex items-center gap-4">
            <span>{wordCount} words</span>
            <span>{charCount} characters</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-text-muted">SyncCanvas</span>
          </div>
        </div>
      </div>

      {/* AI Chat Panel */}
      <AIChatPanel
        isOpen={aiOpen}
        onClose={() => setAiOpen(false)}
        documentContent={textContent}
      />
    </div>
  );
}
