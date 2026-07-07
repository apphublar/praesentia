import { BILLING_AUDIT_ACTIONS } from "@/lib/billing/payment-history";
import { estimateAiCostUsd } from "@/lib/admin/constants";
import type {
  AdminAiUsageRow,
  AdminMetrics,
  AdminRepository,
  AdminTransactionRow,
  AdminUserEventRow,
  AdminUserRow
} from "@/lib/db/admin-types";
import { getSql } from "@/lib/db/client";

function priceFromMetadata(metadata: Record<string, unknown>) {
  const raw = metadata.priceBrl;
  return typeof raw === "number" && Number.isFinite(raw) ? raw : 0;
}

function transactionStatus(metadata: Record<string, unknown>, action: string): AdminTransactionRow["status"] {
  if (metadata.failed === true || metadata.declined === true) return "failed";
  if (metadata.devMode === true) return "test";
  if (action === "event.capsule_activated" && metadata.plan === "family") return "included";
  return "paid";
}

export const postgresAdmin: AdminRepository = {
  async getMetrics() {
    const sql = getSql();

    const [counts] = await sql`
      select
        (select count(*)::int from users where role = 'user') as total_clients,
        (select count(*)::int from events) as total_events,
        (select count(*)::int from events where capsule_activated_at is not null) as active_capsule_events,
        (select coalesce(sum(ai_cover_generations_count), 0)::int from events) as ai_cover_generations,
        (select coalesce(sum(ai_cover_edits_count), 0)::int from events) as ai_cover_edits,
        (select coalesce(sum(ai_text_generations_count), 0)::int from events) as ai_text_generations,
        (select count(*)::int from events where cover_source = 'custom') as custom_image_invites,
        (select count(*)::int from guest_rsvps) as visitor_interactions,
        (select count(*)::int from ai_cover_artifacts where status = 'completed') as ai_artifacts_completed,
        (select count(*)::int from ai_cover_artifacts where status = 'refunded') as ai_artifacts_refunded
    `;

    const [paidClients] = await sql`
      select count(distinct u.id)::int as paid_clients
      from users u
      where u.role = 'user'
        and (
          exists (
            select 1 from user_subscriptions s
            where s.user_id = u.id and s.status = 'active'
          )
          or exists (
            select 1
            from event_members em
            join events e on e.id = em.event_id
            where em.user_id = u.id
              and em.role in ('owner', 'manager')
              and e.capsule_activated_at is not null
          )
        )
    `;

    const billingRows = await sql`
      select action, metadata
      from audit_logs
      where action in ${sql(BILLING_AUDIT_ACTIONS)}
    `;

    let totalRevenueBrl = 0;
    let storagePurchases = 0;
    let aiInvitePlanPurchases = 0;
    let aiCoverPackPurchases = 0;

    for (const row of billingRows) {
      const metadata = (row.metadata as Record<string, unknown>) ?? {};
      if (metadata.devMode === true) continue;
      const action = String(row.action);
      const price = priceFromMetadata(metadata);
      if (action === "subscription.activated" || action === "event.capsule_activated") {
        if (metadata.plan !== "family") totalRevenueBrl += price;
      } else {
        totalRevenueBrl += price;
      }
      if (action === "subscription.storage_expanded" || action === "event.storage_expanded") storagePurchases += 1;
      if (action === "event.ai_invite_plan_purchased") aiInvitePlanPurchases += 1;
      if (action === "event.ai_cover_pack_purchased") aiCoverPackPurchases += 1;
    }

    const totalClients = Number(counts.total_clients ?? 0);
    const paidPlanClients = Number(paidClients.paid_clients ?? 0);
    const aiCoverGenerations = Number(counts.ai_cover_generations ?? 0);
    const aiCoverEdits = Number(counts.ai_cover_edits ?? 0);
    const aiTextGenerations = Number(counts.ai_text_generations ?? 0);

    return {
      totalClients,
      totalRevenueBrl,
      freePlanClients: Math.max(0, totalClients - paidPlanClients),
      paidPlanClients,
      totalEvents: Number(counts.total_events ?? 0),
      activeCapsuleEvents: Number(counts.active_capsule_events ?? 0),
      totalInvitesGenerated: aiCoverGenerations + aiTextGenerations,
      customImageInvites: Number(counts.custom_image_invites ?? 0),
      visitorInteractions: Number(counts.visitor_interactions ?? 0),
      aiCoverGenerations,
      aiCoverEdits,
      aiTextGenerations,
      estimatedAiCostUsd: estimateAiCostUsd({
        coverGenerations: aiCoverGenerations,
        coverEdits: aiCoverEdits,
        textGenerations: aiTextGenerations
      }),
      storagePurchases,
      aiInvitePlanPurchases,
      aiCoverPackPurchases,
      aiArtifactsCompleted: Number(counts.ai_artifacts_completed ?? 0),
      aiArtifactsRefunded: Number(counts.ai_artifacts_refunded ?? 0)
    } satisfies AdminMetrics;
  },

  async listUsers({ search = "", limit = 50, offset = 0 } = {}) {
    const sql = getSql();
    const term = `%${search.trim().toLowerCase()}%`;
    const hasSearch = search.trim() !== "";

    const [{ total }] = await sql`
      select count(*)::int as total
      from users u
      where u.role = 'user'
        and (${!hasSearch} or lower(u.name) like ${term} or lower(u.email) like ${term})
    `;

    const rows = await sql`
      select
        u.id,
        u.name,
        u.email,
        u.role,
        u.created_at,
        u.blocked_at,
        u.admin_notes,
        u.ai_invite_free_used,
        u.ai_invite_pool_remaining,
        u.ai_invite_pool_plan,
        count(e.id)::int as event_count,
        count(e.id) filter (where e.capsule_activated_at is not null)::int as paid_event_count,
        coalesce(sum(e.extra_storage_bytes), 0)::bigint as event_extra_bytes,
        max(greatest(u.updated_at, e.updated_at)) as last_activity_at,
        exists (
          select 1 from user_subscriptions s
          where s.user_id = u.id and s.status = 'active'
        ) as has_active_subscription,
        (
          select s.plan_tier::text
          from user_subscriptions s
          where s.user_id = u.id and s.status = 'active'
          order by s.created_at desc
          limit 1
        ) as subscription_plan,
        coalesce((
          select sum((a.metadata ->> 'priceBrl')::numeric)
          from audit_logs a
          where a.actor_user_id = u.id
            and a.action in ${sql(BILLING_AUDIT_ACTIONS)}
            and coalesce(a.metadata ->> 'devMode', 'false') <> 'true'
        ), 0)::float as total_revenue_brl,
        coalesce((
          select s.extra_storage_bytes
          from user_subscriptions s
          where s.user_id = u.id and s.status = 'active'
          order by s.created_at desc
          limit 1
        ), 0)::bigint as subscription_extra_bytes
      from users u
      left join event_members em on em.user_id = u.id and em.role in ('owner', 'manager')
      left join events e on e.id = em.event_id
      where u.role = 'user'
        and (${!hasSearch} or lower(u.name) like ${term} or lower(u.email) like ${term})
      group by u.id
      order by u.created_at desc
      limit ${limit}
      offset ${offset}
    `;

    const users: AdminUserRow[] = rows.map((row) => {
      const extraBytes = Number(row.event_extra_bytes ?? 0) + Number(row.subscription_extra_bytes ?? 0);
      return {
        id: String(row.id),
        name: String(row.name),
        email: String(row.email),
        role: row.role as AdminUserRow["role"],
        createdAt: new Date(String(row.created_at)).toISOString(),
        blockedAt: row.blocked_at ? new Date(String(row.blocked_at)).toISOString() : null,
        adminNotes: row.admin_notes ? String(row.admin_notes) : null,
        aiInviteFreeUsed: Boolean(row.ai_invite_free_used),
        aiInvitePoolRemaining: Number(row.ai_invite_pool_remaining ?? 0),
        aiInvitePoolPlan: row.ai_invite_pool_plan
          ? (String(row.ai_invite_pool_plan) as AdminUserRow["aiInvitePoolPlan"])
          : null,
        eventCount: Number(row.event_count ?? 0),
        paidEventCount: Number(row.paid_event_count ?? 0),
        hasActiveSubscription: Boolean(row.has_active_subscription),
        subscriptionPlan: row.subscription_plan ? String(row.subscription_plan) : null,
        totalRevenueBrl: Number(row.total_revenue_brl ?? 0),
        storageExtraGb: extraBytes / 1024 ** 3,
        lastActivityAt: row.last_activity_at ? new Date(String(row.last_activity_at)).toISOString() : null
      };
    });

    return { users, total: Number(total ?? 0) };
  },

  async getUserDetail(userId) {
    const sql = getSql();

    const [userRow] = await sql`
      select
        u.id,
        u.name,
        u.email,
        u.role,
        u.created_at,
        u.blocked_at,
        u.admin_notes,
        u.ai_invite_free_used,
        u.ai_invite_pool_remaining,
        u.ai_invite_pool_plan,
        count(e.id)::int as event_count,
        count(e.id) filter (where e.capsule_activated_at is not null)::int as paid_event_count,
        coalesce(sum(e.extra_storage_bytes), 0)::bigint as event_extra_bytes,
        max(greatest(u.updated_at, e.updated_at)) as last_activity_at,
        exists (
          select 1 from user_subscriptions s
          where s.user_id = u.id and s.status = 'active'
        ) as has_active_subscription,
        (
          select s.plan_tier::text
          from user_subscriptions s
          where s.user_id = u.id and s.status = 'active'
          order by s.created_at desc
          limit 1
        ) as subscription_plan,
        coalesce((
          select sum((a.metadata ->> 'priceBrl')::numeric)
          from audit_logs a
          where a.actor_user_id = u.id
            and a.action in ${sql(BILLING_AUDIT_ACTIONS)}
            and coalesce(a.metadata ->> 'devMode', 'false') <> 'true'
        ), 0)::float as total_revenue_brl,
        coalesce((
          select s.extra_storage_bytes
          from user_subscriptions s
          where s.user_id = u.id and s.status = 'active'
          order by s.created_at desc
          limit 1
        ), 0)::bigint as subscription_extra_bytes
      from users u
      left join event_members em on em.user_id = u.id and em.role in ('owner', 'manager')
      left join events e on e.id = em.event_id
      where u.id = ${userId}
      group by u.id
      limit 1
    `;

    if (!userRow) return null;

    const eventRows = await sql`
      select
        e.id, e.title, e.slug, e.plan_tier::text, e.capsule_activated_at, e.phase::text, e.date,
        e.ai_cover_generations_count, e.ai_cover_edits_count, e.cover_source::text,
        e.storage_used_bytes, e.storage_limit_bytes, e.extra_storage_bytes, e.created_at
      from event_members em
      join events e on e.id = em.event_id
      where em.user_id = ${userId}
        and em.role in ('owner', 'manager')
      order by e.created_at desc
    `;

    const extraBytes = Number(userRow.event_extra_bytes ?? 0) + Number(userRow.subscription_extra_bytes ?? 0);
    const user: AdminUserRow = {
      id: String(userRow.id),
      name: String(userRow.name),
      email: String(userRow.email),
      role: userRow.role as AdminUserRow["role"],
      createdAt: new Date(String(userRow.created_at)).toISOString(),
      blockedAt: userRow.blocked_at ? new Date(String(userRow.blocked_at)).toISOString() : null,
      adminNotes: userRow.admin_notes ? String(userRow.admin_notes) : null,
      aiInviteFreeUsed: Boolean(userRow.ai_invite_free_used),
      aiInvitePoolRemaining: Number(userRow.ai_invite_pool_remaining ?? 0),
      aiInvitePoolPlan: userRow.ai_invite_pool_plan
        ? (String(userRow.ai_invite_pool_plan) as AdminUserRow["aiInvitePoolPlan"])
        : null,
      eventCount: Number(userRow.event_count ?? 0),
      paidEventCount: Number(userRow.paid_event_count ?? 0),
      hasActiveSubscription: Boolean(userRow.has_active_subscription),
      subscriptionPlan: userRow.subscription_plan ? String(userRow.subscription_plan) : null,
      totalRevenueBrl: Number(userRow.total_revenue_brl ?? 0),
      storageExtraGb: extraBytes / 1024 ** 3,
      lastActivityAt: userRow.last_activity_at ? new Date(String(userRow.last_activity_at)).toISOString() : null
    };

    const events: AdminUserEventRow[] = eventRows.map((row) => ({
      id: String(row.id),
      title: String(row.title),
      slug: String(row.slug),
      planTier: String(row.plan_tier),
      capsuleActivatedAt: row.capsule_activated_at ? new Date(String(row.capsule_activated_at)).toISOString() : null,
      phase: String(row.phase),
      date: String(row.date),
      aiCoverGenerationsCount: Number(row.ai_cover_generations_count ?? 0),
      aiCoverEditsCount: Number(row.ai_cover_edits_count ?? 0),
      coverSource: row.cover_source ? String(row.cover_source) : null,
      storageUsedGb: Number(row.storage_used_bytes ?? 0) / 1024 ** 3,
      storageLimitGb: Number(row.storage_limit_bytes ?? 0) / 1024 ** 3,
      extraStorageGb: Number(row.extra_storage_bytes ?? 0) / 1024 ** 3,
      createdAt: new Date(String(row.created_at)).toISOString()
    }));

    return { user, events };
  },

  async listRecentEvents({ search = "", limit = 20 } = {}) {
    const sql = getSql();
    const term = `%${search.trim().toLowerCase()}%`;
    const hasSearch = search.trim() !== "";
    const rows = await sql`
      select
        e.id,
        e.title,
        e.slug,
        e.plan_tier::text,
        e.capsule_activated_at,
        e.created_at,
        u.name as owner_name,
        u.email as owner_email
      from events e
      join users u on u.id = e.owner_id
      where ${!hasSearch}
        or lower(e.title) like ${term}
        or lower(e.slug) like ${term}
        or lower(u.name) like ${term}
        or lower(u.email) like ${term}
      order by e.created_at desc
      limit ${limit}
    `;

    return rows.map((row) => ({
      id: String(row.id),
      title: String(row.title),
      slug: String(row.slug),
      ownerName: String(row.owner_name),
      ownerEmail: String(row.owner_email),
      planTier: String(row.plan_tier),
      capsuleActivatedAt: row.capsule_activated_at ? new Date(String(row.capsule_activated_at)).toISOString() : null,
      createdAt: new Date(String(row.created_at)).toISOString()
    }));
  },

  async attachEventToUser(eventId, userId) {
    const sql = getSql();
    await sql.begin(async (tx) => {
      await tx`update events set owner_id = ${userId}, updated_at = now() where id = ${eventId}`;
      await tx`
        insert into event_members (event_id, user_id, role, rsvp_status, access_status)
        values (${eventId}, ${userId}, 'owner', 'confirmed', 'active')
        on conflict (event_id, user_id) do update
        set role = 'owner', rsvp_status = 'confirmed', access_status = 'active', updated_at = now()
      `;
    });
  },

  async setUserBlocked(userId, blocked, actorUserId) {
    const sql = getSql();
    await sql`
      update users
      set blocked_at = ${blocked ? new Date().toISOString() : null}, updated_at = now()
      where id = ${userId}
    `;
    await sql`
      insert into audit_logs (actor_user_id, event_id, action, target_type, target_id, metadata)
      values (
        ${actorUserId}, null, ${blocked ? "admin.user_blocked" : "admin.user_unblocked"},
        'user', ${userId}, ${sql.json({ blocked })}
      )
    `;
  },

  async setUserNotes(userId, notes, actorUserId) {
    const sql = getSql();
    await sql`
      update users set admin_notes = ${notes.trim() || null}, updated_at = now()
      where id = ${userId}
    `;
    await sql`
      insert into audit_logs (actor_user_id, event_id, action, target_type, target_id, metadata)
      values (${actorUserId}, null, 'admin.user_notes_updated', 'user', ${userId}, ${sql.json({ length: notes.length })})
    `;
  },

  async deleteUserAccount(userId) {
    const sql = getSql();

    await sql.begin(async (tx) => {
      await tx`update audit_logs set actor_user_id = null where actor_user_id = ${userId}`;
      await tx`
        update audit_logs
        set event_id = null
        where event_id in (select id from events where owner_id = ${userId})
      `;
      await tx`update event_members set blocked_by_user_id = null where blocked_by_user_id = ${userId}`;
      await tx`delete from media_likes where user_id = ${userId}`;
      await tx`delete from media_items where user_id = ${userId}`;
      await tx`delete from event_members where user_id = ${userId}`;
      await tx`delete from events where owner_id = ${userId}`;
      await tx`delete from users where id = ${userId}`;
    });
  },

  async listTransactions({ limit = 100, offset = 0 } = {}) {
    const sql = getSql();
    const [{ total }] = await sql`
      select count(*)::int as total
      from audit_logs
      where action in ${sql(BILLING_AUDIT_ACTIONS)}
         or action like 'admin.%'
         or metadata ->> 'declined' = 'true'
         or metadata ->> 'failed' = 'true'
    `;

    const rows = await sql`
      select
        a.id,
        a.action,
        a.created_at,
        a.actor_user_id,
        u.name as actor_name,
        u.email as actor_email,
        a.event_id,
        e.title as event_title,
        a.metadata
      from audit_logs a
      left join users u on u.id = a.actor_user_id
      left join events e on e.id = a.event_id
      where a.action in ${sql(BILLING_AUDIT_ACTIONS)}
         or a.action like 'admin.%'
         or a.metadata ->> 'declined' = 'true'
         or a.metadata ->> 'failed' = 'true'
      order by a.created_at desc
      limit ${limit}
      offset ${offset}
    `;

    const mapped: AdminTransactionRow[] = rows.map((row) => {
      const metadata = (row.metadata as Record<string, unknown>) ?? {};
      const action = String(row.action);
      const price = priceFromMetadata(metadata);
      const status = transactionStatus(metadata, action);
      return {
        id: String(row.id),
        action,
        createdAt: new Date(String(row.created_at)).toISOString(),
        actorUserId: row.actor_user_id ? String(row.actor_user_id) : null,
        actorName: row.actor_name ? String(row.actor_name) : null,
        actorEmail: row.actor_email ? String(row.actor_email) : null,
        eventId: row.event_id ? String(row.event_id) : null,
        eventTitle: row.event_title ? String(row.event_title) : null,
        amountBrl: price,
        amountLabel: typeof metadata.priceLabel === "string" ? metadata.priceLabel : price > 0 ? `R$ ${price.toFixed(2).replace(".", ",")}` : "—",
        status,
        metadata
      };
    });

    return { rows: mapped, total: Number(total ?? 0) };
  },

  async listAiUsage({ limit = 100, offset = 0 } = {}) {
    const sql = getSql();
    const [{ total }] = await sql`select count(*)::int as total from ai_cover_artifacts`;
    const rows = await sql`
      select
        a.id,
        a.event_id,
        e.title as event_title,
        a.user_id,
        u.name as user_name,
        a.usage_type,
        a.status,
        a.artifact,
        a.created_at,
        a.completed_at
      from ai_cover_artifacts a
      join events e on e.id = a.event_id
      join users u on u.id = a.user_id
      order by a.created_at desc
      limit ${limit}
      offset ${offset}
    `;

    const mapped: AdminAiUsageRow[] = rows.map((row) => {
      const usageType = row.usage_type === "edit" ? "edit" : "generation";
      const artifact = (row.artifact as Record<string, unknown> | null) ?? {};
      const model = typeof artifact.model === "string" ? artifact.model : null;
      const estimatedCostUsd = usageType === "edit" ? 0.07 : 0.09;
      return {
        id: String(row.id),
        eventId: String(row.event_id),
        eventTitle: String(row.event_title),
        userId: String(row.user_id),
        userName: String(row.user_name),
        usageType,
        status: row.status as AdminAiUsageRow["status"],
        model,
        createdAt: new Date(String(row.created_at)).toISOString(),
        completedAt: row.completed_at ? new Date(String(row.completed_at)).toISOString() : null,
        estimatedCostUsd: row.status === "completed" ? estimatedCostUsd : 0
      };
    });

    return { rows: mapped, total: Number(total ?? 0) };
  }
};
