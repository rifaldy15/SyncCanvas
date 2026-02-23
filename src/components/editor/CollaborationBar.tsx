"use client";

import { motion, AnimatePresence } from "framer-motion";

interface OnlineUser {
  userId: string;
  userName: string;
  userEmail: string;
  color: string;
}

interface CollaborationBarProps {
  onlineUsers: OnlineUser[];
}

const AVATAR_COLORS = [
  "from-blue-500 to-cyan-500",
  "from-purple-500 to-pink-500",
  "from-orange-500 to-yellow-500",
  "from-green-500 to-emerald-500",
  "from-rose-500 to-red-500",
  "from-indigo-500 to-violet-500",
];

export function CollaborationBar({ onlineUsers }: CollaborationBarProps) {
  return (
    <div className="flex items-center gap-2">
      {onlineUsers.length > 0 && (
        <div className="flex items-center gap-1.5 text-xs text-text-muted">
          <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
          {onlineUsers.length} online
        </div>
      )}

      <div className="flex -space-x-2">
        <AnimatePresence>
          {onlineUsers.slice(0, 5).map((user, i) => (
            <motion.div
              key={user.userId}
              initial={{ opacity: 0, scale: 0, x: -10 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              title={`${user.userName} (${user.userEmail})`}
              className={`flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br ${
                AVATAR_COLORS[i % AVATAR_COLORS.length]
              } border-2 border-surface-900 text-[10px] font-bold text-white shadow-sm`}>
              {user.userName.charAt(0).toUpperCase()}
            </motion.div>
          ))}
        </AnimatePresence>

        {onlineUsers.length > 5 && (
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-700 border-2 border-surface-900 text-[10px] font-medium text-text-secondary">
            +{onlineUsers.length - 5}
          </div>
        )}
      </div>
    </div>
  );
}
