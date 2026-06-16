import { estimateAiCostUsd } from "@/lib/admin/constants";
import type { AdminRepository } from "@/lib/db/admin-types";
import { events, users } from "@/lib/mock-data";

export const inMemoryAdmin: AdminRepository = {
  async getMetrics() {
    const clientUsers = users.filter((u) => u.role === "user");
    const paidEvents = events.filter((e) => e.capsuleActivatedAt);
    const aiCoverGenerations = events.reduce((sum, e) => sum + e.aiCoverGenerationsCount, 0);
    const aiCoverEdits = events.reduce((sum, e) => sum + e.aiCoverEditsCount, 0);
    const aiTextGenerations = events.reduce((sum, e) => sum + e.aiTextGenerationsCount, 0);

    return {
      totalClients: clientUsers.length,
      totalRevenueBrl: paidEvents.length * 59,
      freePlanClients: Math.max(0, clientUsers.length - 1),
      paidPlanClients: Math.min(1, clientUsers.length),
      totalEvents: events.length,
      activeCapsuleEvents: paidEvents.length,
      totalInvitesGenerated: aiCoverGenerations + aiTextGenerations,
      customImageInvites: events.filter((e) => e.coverSource === "custom").length,
      visitorInteractions: 12,
      aiCoverGenerations,
      aiCoverEdits,
      aiTextGenerations,
      estimatedAiCostUsd: estimateAiCostUsd({ coverGenerations: aiCoverGenerations, coverEdits: aiCoverEdits, textGenerations: aiTextGenerations }),
      storagePurchases: 0,
      aiInvitePlanPurchases: 0,
      aiCoverPackPurchases: 0,
      aiArtifactsCompleted: aiCoverGenerations,
      aiArtifactsRefunded: 0
    };
  },

  async listUsers({ search = "", limit = 50, offset = 0 } = {}) {
    const filtered = users
      .filter((u) => u.role === "user")
      .filter((u) => {
        if (!search.trim()) return true;
        const term = search.toLowerCase();
        return u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term);
      });

    const slice = filtered.slice(offset, offset + limit);
    return {
      total: filtered.length,
      users: slice.map((u) => {
        const userEvents = u.id === "usr_owner" ? events : [];
        return {
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          createdAt: new Date().toISOString(),
          blockedAt: null,
          adminNotes: null,
          aiInviteFreeUsed: Boolean(u.aiInviteFreeUsed),
          aiInvitePoolRemaining: u.aiInvitePoolRemaining ?? 0,
          aiInvitePoolPlan: u.aiInvitePoolPlan ?? null,
          eventCount: userEvents.length,
          paidEventCount: userEvents.filter((e) => e.capsuleActivatedAt).length,
          hasActiveSubscription: false,
          subscriptionPlan: null,
          totalRevenueBrl: userEvents.some((e) => e.capsuleActivatedAt) ? 59 : 0,
          storageExtraGb: 0,
          lastActivityAt: new Date().toISOString()
        };
      })
    };
  },

  async getUserDetail(userId) {
    const listed = await this.listUsers();
    const user = listed.users.find((u) => u.id === userId);
    if (!user) return null;
        const userEvents = userId === "usr_owner" ? events : [];
    return {
      user,
      events: userEvents.map((e) => ({
        id: e.id,
        title: e.title,
        slug: e.slug,
        planTier: e.plan.tier,
        capsuleActivatedAt: e.capsuleActivatedAt ?? null,
        phase: e.phase,
        date: e.date,
        aiCoverGenerationsCount: e.aiCoverGenerationsCount,
        aiCoverEditsCount: e.aiCoverEditsCount,
        coverSource: e.coverSource ?? null,
        storageUsedGb: e.storageUsedBytes / 1024 ** 3,
        storageLimitGb: e.plan.storageGb,
        extraStorageGb: (e.extraStorageGb ?? 0),
        createdAt: new Date().toISOString()
      }))
    };
  },

  async setUserBlocked() {},
  async setUserNotes() {},
  async listTransactions() {
    return { rows: [], total: 0 };
  },
  async listAiUsage() {
    return { rows: [], total: 0 };
  }
};
