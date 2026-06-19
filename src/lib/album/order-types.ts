import type { PhotoAlbumDraft } from "@/lib/album/types";

export type PhotoAlbumOrderStatus = "draft" | "submitted" | "paid" | "in_production" | "shipped";

export type PhotoAlbumOrder = {
  id: string;
  eventId: string;
  userId: string;
  draft: PhotoAlbumDraft;
  status: PhotoAlbumOrderStatus;
  pageCount: number;
  totalCents: number;
  submittedAt?: string;
  paidAt?: string;
  stripeSessionId?: string;
  createdAt: string;
  updatedAt: string;
};
