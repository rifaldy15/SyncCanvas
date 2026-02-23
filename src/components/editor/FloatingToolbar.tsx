"use client";

import { useEffect, useState, useCallback } from "react";
import type { Editor } from "@tiptap/react";
import { motion, AnimatePresence } from "framer-motion";

interface FloatingToolbarProps {
  editor: Editor | null;
}

export function FloatingToolbar({ editor }: FloatingToolbarProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const updatePosition = useCallback(() => {
    if (!editor) return;

    const { state } = editor;
    const { from, to } = state.selection;

    if (from === to) {
      setIsVisible(false);
      return;
    }

    // Get selection coordinates
    const coords = editor.view.coordsAtPos(from);
    const endCoords = editor.view.coordsAtPos(to);
    const editorRect = editor.view.dom.getBoundingClientRect();

    setPosition({
      top: coords.top - editorRect.top - 48,
      left: (coords.left + endCoords.left) / 2 - editorRect.left - 80,
    });
    setIsVisible(true);
  }, [editor]);

  useEffect(() => {
    if (!editor) return;

    editor.on("selectionUpdate", updatePosition);
    editor.on("blur", () => {
      // Small delay so button clicks register
      setTimeout(() => setIsVisible(false), 200);
    });

    return () => {
      editor.off("selectionUpdate", updatePosition);
    };
  }, [editor, updatePosition]);

  if (!editor) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 5, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 5, scale: 0.95 }}
          transition={{ duration: 0.15 }}
          className="absolute z-50 flex items-center gap-0.5 rounded-xl border border-surface-700/50 bg-surface-900/95 backdrop-blur-xl px-1.5 py-1 shadow-2xl shadow-black/30"
          style={{ top: position.top, left: position.left }}>
          {/* Bold */}
          <ToolBtn
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive("bold")}
            title="Bold">
            <strong className="text-xs">B</strong>
          </ToolBtn>

          {/* Italic */}
          <ToolBtn
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive("italic")}
            title="Italic">
            <em className="text-xs">I</em>
          </ToolBtn>

          {/* Underline */}
          <ToolBtn
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            isActive={editor.isActive("underline")}
            title="Underline">
            <span className="text-xs underline">U</span>
          </ToolBtn>

          {/* Highlight */}
          <ToolBtn
            onClick={() => editor.chain().focus().toggleHighlight().run()}
            isActive={editor.isActive("highlight")}
            title="Highlight">
            <span className="text-xs">🖍</span>
          </ToolBtn>

          <div className="h-5 w-px bg-surface-700/50 mx-0.5" />

          {/* Ask Gemini — the star feature */}
          <button
            onClick={() => {
              const selectedText = editor.state.doc.textBetween(
                editor.state.selection.from,
                editor.state.selection.to,
                " ",
              );
              if (selectedText) {
                // Copy to clipboard and open AI - could also dispatch a custom event
                const event = new CustomEvent("ask-gemini", {
                  detail: { text: selectedText },
                });
                window.dispatchEvent(event);
              }
            }}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium bg-linear-to-r from-accent-600/20 to-brand-600/20 text-accent-600 dark:text-accent-300 border border-accent-500/30 hover:from-accent-600/30 hover:to-brand-600/30 transition-all hover:scale-[1.02] active:scale-95"
            title="Ask Gemini about selected text">
            <span>✨</span>
            <span>Ask AI</span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ToolBtn({
  onClick,
  isActive,
  title,
  children,
}: {
  onClick: () => void;
  isActive?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`rounded-lg p-1.5 transition-all ${
        isActive
          ? "bg-brand-600/20 text-brand-600 dark:text-brand-300"
          : "text-text-muted hover:bg-surface-700/50 hover:text-text-primary"
      }`}>
      {children}
    </button>
  );
}
