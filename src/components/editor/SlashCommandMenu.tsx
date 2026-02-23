"use client";

import { useState, useEffect, useCallback } from "react";
import type { Editor } from "@tiptap/react";
import { motion, AnimatePresence } from "framer-motion";

interface SlashCommand {
  icon: string;
  label: string;
  description: string;
  action: (editor: Editor) => void;
}

const AI_COMMANDS: SlashCommand[] = [
  {
    icon: "✨",
    label: "Summarize",
    description: "Summarize this document",
    action: (editor) =>
      promptAI(editor, "Please summarize the following text:"),
  },
  {
    icon: "🛠",
    label: "Fix Grammar",
    description: "Fix grammar & spelling",
    action: (editor) =>
      promptAI(editor, "Please fix the grammar and spelling for this text:"),
  },
  {
    icon: "🌐",
    label: "Translate to ID",
    description: "Translate to Indonesian",
    action: (editor) =>
      promptAI(editor, "Please translate the following text to Indonesian:"),
  },
  {
    icon: "📝",
    label: "Expand",
    description: "Write more about this",
    action: (editor) =>
      promptAI(editor, "Please expand on this topic and write more details:"),
  },
];

function promptAI(editor: Editor, promptStr: string) {
  // If text is selected, use it. Otherwise, use the text of the current block.
  let text = editor.state.doc.textBetween(
    editor.state.selection.from,
    editor.state.selection.to,
    " ",
  );

  if (!text) {
    const { $from } = editor.state.selection;
    text = $from.parent.textContent;
  }

  const event = new CustomEvent("ask-gemini", {
    detail: {
      text: text || "Please analyze this document.",
      prefilledPrompt: promptStr,
    },
  });
  window.dispatchEvent(event);
}

interface SlashCommandMenuProps {
  editor: Editor | null;
}

export function SlashCommandMenu({ editor }: SlashCommandMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const filteredCommands = AI_COMMANDS.filter(
    (cmd) =>
      cmd.label.toLowerCase().includes(query.toLowerCase()) ||
      cmd.description.toLowerCase().includes(query.toLowerCase()),
  );

  const handleSlashDetect = useCallback(() => {
    if (!editor) return;

    const { state } = editor;
    const { $from } = state.selection;
    const textBefore = $from.parent.textContent.slice(0, $from.parentOffset);

    if (textBefore.endsWith("/")) {
      // Get cursor position
      const coords = editor.view.coordsAtPos($from.pos);
      const editorRect = editor.view.dom.getBoundingClientRect();
      setPosition({
        top: coords.bottom - editorRect.top + 8,
        left: coords.left - editorRect.left,
      });
      setIsOpen(true);
      setQuery("");
      setSelectedIndex(0);
    } else if (isOpen) {
      // Extract query after /
      const slashIndex = textBefore.lastIndexOf("/");
      if (slashIndex !== -1) {
        setQuery(textBefore.slice(slashIndex + 1));
      } else {
        setIsOpen(false);
      }
    }
  }, [editor, isOpen]);

  useEffect(() => {
    if (!editor) return;
    editor.on("update", handleSlashDetect);
    return () => {
      editor.off("update", handleSlashDetect);
    };
  }, [editor, handleSlashDetect]);

  // Handle keyboard nav
  useEffect(() => {
    if (!isOpen || !editor) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredCommands.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev === 0 ? filteredCommands.length - 1 : prev - 1,
        );
      } else if (e.key === "Enter" && filteredCommands.length > 0) {
        e.preventDefault();
        executeCommand(filteredCommands[selectedIndex]);
      } else if (e.key === "Escape") {
        setIsOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown, { capture: true });
    return () =>
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
  }, [isOpen, selectedIndex, filteredCommands, editor]);

  function executeCommand(cmd: SlashCommand) {
    if (!editor) return;

    // Delete the slash (and any query chars) first
    const { state } = editor;
    const { $from } = state.selection;
    const textBefore = $from.parent.textContent.slice(0, $from.parentOffset);
    const slashIndex = textBefore.lastIndexOf("/");
    const charsToDelete = $from.parentOffset - slashIndex;

    editor
      .chain()
      .focus()
      .deleteRange({
        from: $from.pos - charsToDelete,
        to: $from.pos,
      })
      .run();

    cmd.action(editor);
    setIsOpen(false);
  }

  return (
    <AnimatePresence>
      {isOpen && filteredCommands.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -5, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -5, scale: 0.97 }}
          transition={{ duration: 0.15 }}
          className="absolute z-50 w-64 rounded-xl border border-surface-700/50 bg-surface-900/95 backdrop-blur-xl py-1.5 shadow-2xl shadow-black/30"
          style={{ top: position.top, left: position.left }}>
          <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
            Commands
          </p>
          {filteredCommands.map((cmd, i) => (
            <button
              key={cmd.label}
              onClick={() => executeCommand(cmd)}
              onMouseEnter={() => setSelectedIndex(i)}
              className={`flex w-full items-center gap-3 px-3 py-2 text-left transition-colors ${
                i === selectedIndex
                  ? "bg-brand-600/15 text-brand-600 dark:text-brand-300"
                  : "text-text-secondary hover:bg-surface-800"
              }`}>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-800 text-sm">
                {cmd.icon}
              </span>
              <div>
                <p className="text-sm font-medium">{cmd.label}</p>
                <p className="text-[11px] text-text-muted">{cmd.description}</p>
              </div>
            </button>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
