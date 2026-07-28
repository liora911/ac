"use client";

import { useCallback, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

/**
 * "New since you last looked" badges for the admin sidebar.
 *
 * There is no server-side read/seen flag on messages or comments, so "new" is
 * derived: we compare the newest item's createdAt against a per-tab "last seen"
 * timestamp kept in localStorage. Opening the tab stamps it seen. Per-browser
 * by design — fine for a single-admin site, and needs zero DB changes.
 */

const SEEN_PREFIX = "elitzur-seen-";

type SeenKey = "messages" | "comments";

function latestCreatedAt(items: Array<{ createdAt?: string }> | undefined): number {
  if (!Array.isArray(items)) return 0;
  let max = 0;
  for (const item of items) {
    const ts = item?.createdAt ? new Date(item.createdAt).getTime() : 0;
    if (ts > max) max = ts;
  }
  return max;
}

async function fetchArray(url: string): Promise<Array<{ createdAt?: string }>> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}`);
  const data = await res.json();
  if (Array.isArray(data)) return data;
  return data.items ?? data.messages ?? [];
}

function readSeen(key: SeenKey): number {
  try {
    return Number(localStorage.getItem(SEEN_PREFIX + key) || 0);
  } catch {
    return 0;
  }
}

export function useAdminBadges(enabled: boolean) {
  const messages = useQuery({
    queryKey: ["admin-badge", "messages"],
    queryFn: () => fetchArray("/api/contact"),
    enabled,
    staleTime: 60_000,
    refetchOnWindowFocus: true,
  });
  const comments = useQuery({
    queryKey: ["admin-badge", "comments"],
    queryFn: () => fetchArray("/api/comments"),
    enabled,
    staleTime: 60_000,
    refetchOnWindowFocus: true,
  });

  const [seen, setSeen] = useState<Record<SeenKey, number>>({
    messages: 0,
    comments: 0,
  });
  useEffect(() => {
    setSeen({ messages: readSeen("messages"), comments: readSeen("comments") });
  }, []);

  const markSeen = useCallback((key: SeenKey, latest: number) => {
    setSeen((prev) => (prev[key] === latest ? prev : { ...prev, [key]: latest }));
    try {
      localStorage.setItem(SEEN_PREFIX + key, String(latest));
    } catch {
      // storage unavailable — badge just won't persist as seen
    }
  }, []);

  const messagesLatest = latestCreatedAt(messages.data);
  const commentsLatest = latestCreatedAt(comments.data);

  return {
    messagesNew: messagesLatest > 0 && messagesLatest > seen.messages,
    commentsNew: commentsLatest > 0 && commentsLatest > seen.comments,
    messagesLatest,
    commentsLatest,
    markSeen,
  };
}
