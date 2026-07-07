import type { AiInvitePoolPlan } from "@/types/domain";

export type AdminMetrics = {
  totalClients: number;
  totalRevenueBrl: number;
  freePlanClients: number;
  paidPlanClients: number;
  totalEvents: number;
  activeCapsuleEvents: number;
  totalInvitesGenerated: number;
  customImageInvites: number;
  visitorInteractions: number;
  aiCoverGenerations: number;
  aiCoverEdits: number;
  aiTextGenerations: number;
  estimatedAiCostUsd: number;
  storagePurchases: number;
  aiInvitePlanPurchases: number;
  aiCoverPackPurchases: number;
  aiArtifactsCompleted: number;
  aiArtifactsRefunded: number;
};

export type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  role: "platform_admin" | "user";
  createdAt: string;
  blockedAt: string | null;
  adminNotes: string | null;
  aiInviteFreeUsed: boolean;
  aiInvitePoolRemaining: number;
  aiInvitePoolPlan: AiInvitePoolPlan | null;
  eventCount: number;
  paidEventCount: number;
  hasActiveSubscription: boolean;
  subscriptionPlan: string | null;
  totalRevenueBrl: number;
  storageExtraGb: number;
  lastActivityAt: string | null;
};

export type AdminUserEventRow = {
  id: string;
  title: string;
  slug: string;
  planTier: string;
  capsuleActivatedAt: string | null;
  phase: string;
  date: string;
  aiCoverGenerationsCount: number;
  aiCoverEditsCount: number;
  coverSource: string | null;
  storageUsedGb: number;
  storageLimitGb: number;
  extraStorageGb: number;
  createdAt: string;
};

export type AdminEventLookupRow = {
  id: string;
  title: string;
  slug: string;
  ownerName: string;
  ownerEmail: string;
  planTier: string;
  capsuleActivatedAt: string | null;
  createdAt: string;
};

export type AdminTransactionRow = {
  id: string;
  action: string;
  createdAt: string;
  actorUserId: string | null;
  actorName: string | null;
  actorEmail: string | null;
  eventId: string | null;
  eventTitle: string | null;
  amountBrl: number;
  amountLabel: string;
  status: "paid" | "included" | "test" | "failed";
  metadata: Record<string, unknown>;
};

export type AdminAiUsageRow = {
  id: string;
  eventId: string;
  eventTitle: string;
  userId: string;
  userName: string;
  usageType: "generation" | "edit";
  status: "reserved" | "completed" | "refunded";
  model: string | null;
  createdAt: string;
  completedAt: string | null;
  estimatedCostUsd: number;
};

export interface AdminRepository {
  getMetrics(): Promise<AdminMetrics>;
  listUsers(options?: { search?: string; limit?: number; offset?: number }): Promise<{ users: AdminUserRow[]; total: number }>;
  getUserDetail(userId: string): Promise<{ user: AdminUserRow; events: AdminUserEventRow[] } | null>;
  listRecentEvents(options?: { search?: string; limit?: number }): Promise<AdminEventLookupRow[]>;
  attachEventToUser(eventId: string, userId: string): Promise<void>;
  setUserBlocked(userId: string, blocked: boolean, actorUserId: string): Promise<void>;
  setUserNotes(userId: string, notes: string, actorUserId: string): Promise<void>;
  deleteUserAccount(userId: string): Promise<void>;
  listTransactions(options?: { limit?: number; offset?: number }): Promise<{ rows: AdminTransactionRow[]; total: number }>;
  listAiUsage(options?: { limit?: number; offset?: number }): Promise<{ rows: AdminAiUsageRow[]; total: number }>;
}
