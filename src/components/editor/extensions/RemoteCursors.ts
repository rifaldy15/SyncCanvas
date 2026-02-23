"use client";

import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

// Custom extension to render remote cursors inside TipTap without heavy Yjs dependency
export interface RemoteCursorData {
  userId: string;
  userName: string;
  color: string;
  pos: number;
}

const RemoteCursorPluginKey = new PluginKey("remoteCursor");

export const RemoteCursors = Extension.create({
  name: "remoteCursors",

  addOptions() {
    return {
      cursors: [] as RemoteCursorData[],
    };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: RemoteCursorPluginKey,
        state: {
          init() {
            return DecorationSet.empty;
          },
          apply(tr, oldSet) {
            const cursors: RemoteCursorData[] | undefined = tr.getMeta(
              RemoteCursorPluginKey,
            );

            if (cursors !== undefined) {
              const decos = cursors.map((c) => {
                // Ensure pos is valid
                const pos = Math.max(0, Math.min(c.pos, tr.doc.content.size));

                const widget = document.createElement("span");
                widget.className = `relative inline-block border-l-2 ml-[-1px] z-50 transition-all duration-200`;
                widget.style.borderColor = c.color;

                const label = document.createElement("span");
                label.className = `absolute top-0 left-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold text-white whitespace-nowrap shadow-sm`;
                label.style.backgroundColor = c.color;
                label.style.transform = "translateY(-100%)";
                label.innerText = c.userName;

                widget.appendChild(label);

                return Decoration.widget(pos, widget, {
                  key: c.userId,
                  side: 1, // Draw after the character
                });
              });
              return DecorationSet.create(tr.doc, decos);
            }

            // If text changes, map the positions so cursors flow with text
            return oldSet.map(tr.mapping, tr.doc);
          },
        },
        props: {
          decorations(state) {
            return this.getState(state);
          },
        },
      }),
    ];
  },
});

/** Helper to update cursors imperatively from React without re-initializing the whole editor */
export function updateRemoteCursors(editor: any, cursors: RemoteCursorData[]) {
  if (!editor || !editor.view) return;
  const tr = editor.state.tr.setMeta(RemoteCursorPluginKey, cursors);
  editor.view.dispatch(tr);
}
