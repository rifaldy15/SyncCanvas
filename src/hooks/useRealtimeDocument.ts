"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface OnlineUser {
  userId: string;
  userName: string;
  userEmail: string;
  color: string;
}

interface UseRealtimeDocumentOptions {
  documentId: string;
  userId: string;
  userName: string;
  userEmail: string;
}

interface DocumentChange {
  title?: string;
  content?: string;
}

export interface RemoteCursor {
  userId: string;
  userName: string;
  color: string;
  pos: number;
}

export function useRealtimeDocument({
  documentId,
  userId,
  userName,
  userEmail,
}: UseRealtimeDocumentOptions) {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [remoteCursors, setRemoteCursors] = useState<RemoteCursor[]>([]);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const supabaseRef = useRef(createClient());
  const myColorRef = useRef(`hsl(${Math.random() * 360}, 70%, 60%)`);

  useEffect(() => {
    const supabase = supabaseRef.current;
    const channelName = `document:${documentId}`;

    const channel = supabase.channel(channelName, {
      config: {
        presence: { key: userId },
      },
    });

    // Presence — track who's online
    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const users: OnlineUser[] = [];

        Object.entries(state).forEach(([, presences]) => {
          const presence = presences[0] as unknown as {
            userId: string;
            userName: string;
            userEmail: string;
            color: string;
          };
          if (presence.userId !== userId) {
            users.push({
              userId: presence.userId,
              userName: presence.userName,
              userEmail: presence.userEmail,
              color: presence.color,
            });
          }
        });

        setOnlineUsers(users);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            userId,
            userName,
            userEmail,
            color: myColorRef.current,
            online_at: new Date().toISOString(),
          });
        }
      });

    // Listen for broadcasted cursors
    channel.on("broadcast", { event: "cursor_move" }, ({ payload }) => {
      setRemoteCursors((prev) => {
        const existing = prev.filter((c) => c.userId !== payload.userId);
        return [...existing, payload as RemoteCursor];
      });
    });

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
    };
  }, [documentId, userId, userName, userEmail]);

  const broadcastChange = useCallback(
    (change: DocumentChange) => {
      if (channelRef.current) {
        channelRef.current.send({
          type: "broadcast",
          event: "document_change",
          payload: {
            userId,
            ...change,
          },
        });
      }
    },
    [userId],
  );

  const broadcastCursor = useCallback(
    (pos: number) => {
      if (channelRef.current) {
        channelRef.current.send({
          type: "broadcast",
          event: "cursor_move",
          payload: {
            userId,
            userName,
            color: myColorRef.current,
            pos,
          },
        });
      }
    },
    [userId, userName],
  );

  return {
    onlineUsers,
    remoteCursors,
    broadcastChange,
    broadcastCursor,
  };
}
