"use client";

import { useState } from "react";

export function LikeButton({
  eventId,
  mediaId,
  initialCount,
  guestMural = false
}: {
  eventId: string;
  mediaId: string;
  initialCount: number;
  guestMural?: boolean;
}) {
  const [count, setCount] = useState(initialCount);
  const [liked, setLiked] = useState(false);
  const [pending, setPending] = useState(false);

  async function toggleLike() {
    setPending(true);
    try {
      const response = await fetch(`/api/events/${eventId}/likes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mediaId })
      });
      if (!response.ok) return;
      const data = (await response.json()) as { likesCount: number; liked: boolean };
      setCount(data.likesCount);
      setLiked(data.liked);
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      onClick={toggleLike}
      disabled={pending}
      className="btn secondary"
      style={{ padding: "7px 10px", borderRadius: 999, fontSize: 12 }}
      aria-pressed={liked}
    >
      {guestMural ? (liked ? "♥" : "♡") : null} {count} curtidas
    </button>
  );
}
