import { getSql } from "@/lib/db/client";
import type {
  AuditRepository,
  CreateEventInput,
  AiCoverArtifactRepository,
  CreateGuestRsvpInput,
  CreateMediaInput,
  EventRepository,
  GuestMessageRepository,
  GuestRsvpRepository,
  LikeRepository,
  MuralAccessRepository,
  MediaRepository,
  MemberRepository,
  SubscriptionRepository,
  UpdateEventInput,
  UserRepository
} from "@/lib/db/repositories";
import { bytesFromGb, PLANS } from "@/lib/plans";
import { normalizeEventDateString, normalizeEventTimeString } from "@/lib/events/datetime";
import { normalizeEventType } from "@/lib/events/event-types";
import { normalizeInviteCopy } from "@/lib/events/invite-copy";
import type {
  Event,
  EventMember,
  EventType,
  GiftSuggestion,
  GuestCompanionDetail,
  GuestMessage,
  GuestRsvp,
  MuralAccessRequest,
  InviteCopy,
  MediaItem,
  PlanTier,
  User,
  UserSubscription
} from "@/types/domain";

function parseGiftSuggestions(raw: unknown): GiftSuggestion[] {
  if (!Array.isArray(raw)) return [];
  const items: GiftSuggestion[] = [];
  raw.forEach((item, index) => {
    if (!item || typeof item !== "object") return;
    const row = item as Record<string, unknown>;
    const title = String(row.title ?? "").trim();
    if (!title) return;
    items.push({
      id: String(row.id ?? `gift_${index}`),
      title,
      note: row.note ? String(row.note) : undefined,
      imageUrl: row.imageUrl ? String(row.imageUrl) : undefined,
      linkUrl: row.linkUrl ? String(row.linkUrl) : undefined
    });
  });
  return items;
}

function slugifyEventTitle(title: string) {
  const base = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return base || "evento";
}

function isPostgresUniqueViolation(error: unknown) {
  return Boolean(error && typeof error === "object" && "code" in error && (error as { code: string }).code === "23505");
}

async function allocateEventSlug(sql: ReturnType<typeof getSql>, title: string) {
  const base = slugifyEventTitle(title);
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const candidate = attempt === 0 ? base : `${base}-${Math.random().toString(36).slice(2, 6)}`;
    const rows = await sql`select 1 from events where slug = ${candidate} limit 1`;
    if (!rows.length) return candidate;
  }
  return `${base}-${Date.now().toString(36)}`;
}

function parseCompanionsDetail(raw: unknown): GuestCompanionDetail[] {
  if (!Array.isArray(raw)) return [];
  const items: GuestCompanionDetail[] = [];
  raw.forEach((item) => {
    if (!item || typeof item !== "object") return;
    const row = item as Record<string, unknown>;
    const name = String(row.name ?? "").trim();
    if (!name) return;
    const type: GuestCompanionDetail["type"] = row.type === "child" ? "child" : "adult";
    const age = row.age != null && row.age !== "" ? Number(row.age) : undefined;
    items.push({ name, type, age: Number.isFinite(age) ? age : undefined });
  });
  return items;
}

function rowToUser(row: Record<string, unknown>): User {
  const poolPlan = row.ai_invite_pool_plan ? String(row.ai_invite_pool_plan) : undefined;
  return {
    id: String(row.id),
    name: String(row.name),
    email: String(row.email),
    role: row.role as User["role"],
    aiInviteFreeUsed: Boolean(row.ai_invite_free_used),
    aiInvitePoolRemaining: Number(row.ai_invite_pool_remaining ?? 0),
    aiInvitePoolPlan:
      poolPlan === "inspiracao" || poolPlan === "criativo" ? poolPlan : undefined
  };
}

function rowToEvent(row: Record<string, unknown>): Event {
  const plan = PLANS[row.plan_tier as keyof typeof PLANS] ?? PLANS.free;
  return {
    id: String(row.id),
    slug: String(row.slug),
    freeCode: row.free_code ? String(row.free_code) : undefined,
    subdomain: row.subdomain ? String(row.subdomain) : undefined,
    title: String(row.title),
    theme: String(row.theme),
    eventType: normalizeEventType(String(row.event_type ?? "outros")),
    hostName: String(row.host_name ?? row.owner_name ?? "Responsável"),
    hostPhotoUrl: row.host_photo_url ? String(row.host_photo_url) : undefined,
    coverImageUrl: row.cover_image_url ? String(row.cover_image_url) : undefined,
    coverSource: row.cover_source ? (row.cover_source as Event["coverSource"]) : undefined,
    aiCoverGenerationsCount: Number(row.ai_cover_generations_count ?? 0),
    aiCoverEditsCount: Number(row.ai_cover_edits_count ?? 0),
    aiCoverPackBonusGenerations: Number(row.ai_cover_pack_bonus_generations ?? 0),
    aiCoverPackBonusEdits: Number(row.ai_cover_pack_bonus_edits ?? 0),
    aiTextGenerationsCount: Number(row.ai_text_generations_count ?? 0),
    aiTextEditsCount: Number(row.ai_text_edits_count ?? 0),
    aiCoverPendingUrls: Array.isArray(row.ai_cover_pending_urls)
      ? (row.ai_cover_pending_urls as string[])
      : undefined,
    inviteCopy: normalizeInviteCopy(row.invite_copy as Partial<InviteCopy>),
    eventFormat: (row.event_format as Event["eventFormat"]) ?? "in_person",
    onlineMeetingUrl: row.online_meeting_url ? String(row.online_meeting_url) : undefined,
    capsuleActivatedAt: row.capsule_activated_at
      ? new Date(String(row.capsule_activated_at)).toISOString()
      : undefined,
    date: normalizeEventDateString(row.date),
    startsAt: normalizeEventTimeString(row.starts_at),
    endsAt: normalizeEventTimeString(row.ends_at),
    organizerName: row.organizer_name ? String(row.organizer_name) : undefined,
    venueName: String(row.venue_name),
    venueAddress: String(row.venue_address),
    venueZip: row.venue_zip ? String(row.venue_zip) : undefined,
    venueComplement: row.venue_complement ? String(row.venue_complement) : undefined,
    city: String(row.city),
    rsvpEnabled: row.rsvp_enabled !== false,
    rsvpDeadline: row.rsvp_deadline ? normalizeEventDateString(row.rsvp_deadline) : undefined,
    checkInNotes: row.check_in_notes ? String(row.check_in_notes) : undefined,
    giftSuggestions: parseGiftSuggestions(row.gift_suggestions),
    visibility: row.visibility as Event["visibility"],
    phase: row.phase as Event["phase"],
    plan,
    storageUsedBytes: Number(row.storage_used_bytes ?? 0),
    storageUsedGb: Number(row.storage_used_bytes ?? 0) / 1024 / 1024 / 1024,
    extraStorageGb: Number(row.extra_storage_bytes ?? 0) / 1024 / 1024 / 1024,
    pix: row.pix_enabled
      ? {
          enabled: Boolean(row.pix_enabled),
          receiverName: String(row.pix_receiver_name),
          key: String(row.pix_key_encrypted),
          suggestedAmount: row.pix_suggested_amount_cents ? Number(row.pix_suggested_amount_cents) / 100 : undefined,
          goalAmount: row.pix_suggested_amount_cents ? Number(row.pix_suggested_amount_cents) / 100 : undefined,
          minPerPerson: row.pix_min_per_person_cents ? Number(row.pix_min_per_person_cents) / 100 : undefined,
          message: row.pix_message ? String(row.pix_message) : undefined
        }
      : undefined,
    screen: {
      enabled: Boolean(row.screen_enabled),
      token: "stored-as-hash",
      paused: Boolean(row.screen_paused),
      showQrCode: row.screen_show_qr_code !== false,
      showVideos: row.screen_show_videos !== false,
      showMessages: row.screen_show_messages !== false,
      layout: "recent_plus_top3"
    }
  };
}

function rowToMember(row: Record<string, unknown>): EventMember {
  return {
    id: String(row.id),
    eventId: String(row.event_id),
    userId: String(row.user_id),
    role: row.role as EventMember["role"],
    rsvpStatus: row.rsvp_status as EventMember["rsvpStatus"],
    accessStatus: row.access_status as EventMember["accessStatus"],
    joinedAt: new Date(String(row.joined_at)).toISOString()
  };
}

function rowToMedia(row: Record<string, unknown>): MediaItem {
  return {
    id: String(row.id),
    eventId: String(row.event_id),
    userId: String(row.user_id),
    guestRsvpId: row.guest_rsvp_id ? String(row.guest_rsvp_id) : undefined,
    authorName: String(row.author_display_name ?? row.author_name ?? "Convidado"),
    caption: row.caption ? String(row.caption) : undefined,
    type: row.type as MediaItem["type"],
    status: row.status as MediaItem["status"],
    visibleOnScreen: Boolean(row.visible_on_screen),
    r2Key: row.r2_key ? String(row.r2_key) : undefined,
    url: row.url ? String(row.url) : undefined,
    thumbnailUrl: row.thumbnail_url ? String(row.thumbnail_url) : undefined,
    text: row.text ? String(row.text) : undefined,
    byteSize: Number(row.byte_size ?? 0),
    likesCount: Number(row.likes_count ?? 0),
    createdAt: new Date(String(row.created_at)).toISOString()
  };
}

export const postgresUsers: UserRepository = {
  async findById(id) {
    const sql = getSql();
    const rows = await sql`
      select id, name, email, role, ai_invite_free_used, ai_invite_pool_remaining, ai_invite_pool_plan
      from users where id = ${id} limit 1
    `;
    return rows[0] ? rowToUser(rows[0]) : null;
  },
  async findByEmail(email) {
    const sql = getSql();
    const rows = await sql`
      select id, name, email, role, ai_invite_free_used, ai_invite_pool_remaining, ai_invite_pool_plan
      from users where email = ${email} limit 1
    `;
    return rows[0] ? rowToUser(rows[0]) : null;
  },
  async purchaseAiInvitePlan(userId, plan) {
    const sql = getSql();
    const versions = plan === "inspiracao" ? 5 : 15;
    await sql`
      update users set
        ai_invite_pool_remaining = ai_invite_pool_remaining + ${versions},
        ai_invite_pool_plan = ${plan},
        updated_at = now()
      where id = ${userId}
    `;
    return (await this.findById(userId)) as User;
  },
  async consumeAiInviteGeneration(userId, event) {
    if (event.capsuleActivatedAt) return;
    const user = await this.findById(userId);
    if (!user) return;
    const sql = getSql();
    if ((user.aiInvitePoolRemaining ?? 0) > 0) {
      await sql`
        update users set ai_invite_pool_remaining = greatest(0, ai_invite_pool_remaining - 1), updated_at = now()
        where id = ${userId}
      `;
      return;
    }
    if (!user.aiInviteFreeUsed && event.aiCoverGenerationsCount <= 1) {
      await sql`
        update users set ai_invite_free_used = true, updated_at = now()
        where id = ${userId}
      `;
    }
  },
  async refundAiInviteGeneration(userId, event) {
    if (event.capsuleActivatedAt) return;
    const user = await this.findById(userId);
    if (!user) return;
    const sql = getSql();
    if ((user.aiInvitePoolRemaining ?? 0) >= 0 && user.aiInvitePoolPlan) {
      await sql`
        update users set ai_invite_pool_remaining = ai_invite_pool_remaining + 1, updated_at = now()
        where id = ${userId} and ai_invite_pool_plan is not null
      `;
      return;
    }
    if (user.aiInviteFreeUsed && event.aiCoverGenerationsCount <= 1) {
      await sql`
        update users set ai_invite_free_used = false, updated_at = now()
        where id = ${userId}
      `;
    }
  }
};

export const postgresEvents: EventRepository = {
  async findById(id) {
    const sql = getSql();
    const rows = await sql`
      select e.*, u.name as owner_name, p.enabled as pix_enabled, p.receiver_name as pix_receiver_name,
        p.key_encrypted as pix_key_encrypted, p.suggested_amount_cents as pix_suggested_amount_cents,
        p.min_per_person_cents as pix_min_per_person_cents, p.message as pix_message,
        s.enabled as screen_enabled, s.paused as screen_paused,
        s.show_qr_code as screen_show_qr_code, s.show_videos as screen_show_videos,
        s.show_messages as screen_show_messages
      from events e
      join users u on u.id = e.owner_id
      left join pix_settings p on p.event_id = e.id
      left join screen_settings s on s.event_id = e.id
      where e.id = ${id}
      limit 1
    `;
    return rows[0] ? rowToEvent(rows[0]) : null;
  },
  async findBySlugOrCode(slugOrCode) {
    const sql = getSql();
    const rows = await sql`
      select e.*, u.name as owner_name, p.enabled as pix_enabled, p.receiver_name as pix_receiver_name,
        p.key_encrypted as pix_key_encrypted, p.suggested_amount_cents as pix_suggested_amount_cents,
        p.min_per_person_cents as pix_min_per_person_cents, p.message as pix_message,
        s.enabled as screen_enabled, s.paused as screen_paused,
        s.show_qr_code as screen_show_qr_code, s.show_videos as screen_show_videos,
        s.show_messages as screen_show_messages
      from events e
      join users u on u.id = e.owner_id
      left join pix_settings p on p.event_id = e.id
      left join screen_settings s on s.event_id = e.id
      where e.slug = ${slugOrCode} or e.free_code = ${slugOrCode}
      limit 1
    `;
    return rows[0] ? rowToEvent(rows[0]) : null;
  },
  async listByOwner(userId) {
    const sql = getSql();
    const rows = await sql`
      select e.*, u.name as owner_name, p.enabled as pix_enabled, p.receiver_name as pix_receiver_name,
        p.key_encrypted as pix_key_encrypted, p.suggested_amount_cents as pix_suggested_amount_cents,
        p.min_per_person_cents as pix_min_per_person_cents, p.message as pix_message,
        s.enabled as screen_enabled, s.paused as screen_paused,
        s.show_qr_code as screen_show_qr_code, s.show_videos as screen_show_videos,
        s.show_messages as screen_show_messages
      from events e
      join users u on u.id = e.owner_id
      join event_members m on m.event_id = e.id
      left join pix_settings p on p.event_id = e.id
      left join screen_settings s on s.event_id = e.id
      where m.user_id = ${userId} and m.role in ('owner', 'manager')
      order by e.created_at desc
    `;
    return rows.map(rowToEvent);
  },
  async findOwnerId(eventId) {
    const sql = getSql();
    const rows = await sql`
      select user_id from event_members
      where event_id = ${eventId} and role = 'owner'
      limit 1
    `;
    return rows[0] ? String(rows[0].user_id) : null;
  },
  async sumFamilyStorageUsedBytes(ownerId) {
    const sql = getSql();
    const rows = await sql`
      select coalesce(sum(storage_used_bytes), 0)::bigint as total
      from events
      where owner_id = ${ownerId}
        and plan_tier = 'family'
        and capsule_activated_at is not null
    `;
    return Number(rows[0]?.total ?? 0);
  },
  async addExtraStorage(eventId, gb) {
    const sql = getSql();
    const bytes = bytesFromGb(gb);
    await sql`
      update events
      set extra_storage_bytes = extra_storage_bytes + ${bytes}, updated_at = now()
      where id = ${eventId}
    `;
    return (await this.findById(eventId)) as Event;
  },
  async countCapsuleEventsByOwner(userId, since) {
    const sql = getSql();
    const rows = await sql`
      select count(*)::int as total
      from events e
      where e.owner_id = ${userId}
        and e.plan_tier = 'family'
        and e.capsule_activated_at is not null
        and e.capsule_activated_at >= ${since}
    `;
    return Number(rows[0]?.total ?? 0);
  },
  async sumAiCoverGenerationsByOwner(userId, tier) {
    const sql = getSql();
    if (tier === "family") {
      const rows = await sql`
        select coalesce(sum(ai_cover_generations_count), 0)::int as total
        from events e
        where e.owner_id = ${userId}
          and e.plan_tier = 'family'
          and e.capsule_activated_at is not null
      `;
      return Number(rows[0]?.total ?? 0);
    }
    const rows = await sql`
      select coalesce(sum(ai_cover_generations_count), 0)::int as total
      from events e
      where e.owner_id = ${userId}
        and e.capsule_activated_at is null
    `;
    return Number(rows[0]?.total ?? 0);
  },
  async create(input: CreateEventInput) {
    const sql = getSql();
    const plan = PLANS.free;
    let slug = await allocateEventSlug(sql, input.title);

    for (let attempt = 0; attempt < 6; attempt += 1) {
      const freeCode = Math.random().toString(36).slice(2, 8);
      try {
        const rows = await sql`
          insert into events (
            owner_id, slug, free_code, title, theme, event_type, host_name, organizer_name, date, starts_at, ends_at,
            venue_name, venue_address, venue_zip, venue_complement, city, event_format, online_meeting_url,
            rsvp_enabled, rsvp_deadline, gift_suggestions, plan_tier, storage_limit_bytes, retention_until
          )
          values (
            ${input.ownerId}, ${slug}, ${freeCode}, ${input.title},
            ${input.theme}, ${input.eventType}, ${input.hostName}, ${input.organizerName ?? null},
            ${input.date}, ${input.startsAt}, ${input.endsAt}, ${input.venueName}, ${input.venueAddress},
            ${input.venueZip ?? null}, ${input.venueComplement ?? null}, ${input.city},
            ${input.eventFormat}, ${input.onlineMeetingUrl ?? null},
            ${input.rsvpEnabled !== false}, ${input.rsvpDeadline ?? null},
            ${sql.json(JSON.parse(JSON.stringify(input.giftSuggestions ?? [])))},
            ${plan.tier}, ${bytesFromGb(plan.storageGb)}, now() + interval '36 months'
          )
          returning *
        `;
        await sql`
          insert into event_members (event_id, user_id, role, rsvp_status)
          values (${rows[0].id}, ${input.ownerId}, 'owner', 'confirmed')
        `;
        return (await this.findById(String(rows[0].id))) as Event;
      } catch (error) {
        if (isPostgresUniqueViolation(error) && attempt < 5) {
          slug = await allocateEventSlug(sql, input.title);
          continue;
        }
        throw error;
      }
    }

    throw new Error("EVENT_CREATE_UNIQUE_EXHAUSTED");
  },
  async patchCreationFields(eventId, _actorUserId, input) {
    const sql = getSql();
    const event = await this.findById(eventId);
    if (!event) throw new Error("EVENT_NOT_FOUND");
    await sql`
      update events set
        organizer_name = ${input.organizerName ?? event.organizerName ?? null},
        venue_zip = ${input.venueZip ?? event.venueZip ?? null},
        venue_complement = ${input.venueComplement ?? event.venueComplement ?? null},
        rsvp_enabled = ${input.rsvpEnabled ?? event.rsvpEnabled},
        gift_suggestions = ${sql.json(JSON.parse(JSON.stringify(input.giftSuggestions ?? event.giftSuggestions)))},
        host_name = ${input.hostName ?? event.hostName},
        updated_at = now()
      where id = ${eventId}
    `;
    return (await this.findById(eventId)) as Event;
  },
  async update(eventId, _actorUserId, input: UpdateEventInput) {
    const sql = getSql();
    const event = await this.findById(eventId);
    if (!event) throw new Error("EVENT_NOT_FOUND");
    await sql`
      update events set
        title = ${input.title ?? event.title},
        theme = ${input.theme ?? event.theme},
        host_name = ${input.hostName ?? event.hostName},
        organizer_name = ${input.organizerName !== undefined ? input.organizerName : event.organizerName ?? null},
        event_format = ${input.eventFormat ?? event.eventFormat},
        online_meeting_url = ${input.onlineMeetingUrl !== undefined ? input.onlineMeetingUrl : event.onlineMeetingUrl ?? null},
        date = ${input.date ?? event.date},
        starts_at = ${input.startsAt ?? event.startsAt},
        ends_at = ${input.endsAt ?? event.endsAt},
        venue_name = ${input.venueName ?? event.venueName},
        venue_address = ${input.venueAddress ?? event.venueAddress},
        venue_zip = ${input.venueZip !== undefined ? input.venueZip : event.venueZip ?? null},
        venue_complement = ${input.venueComplement !== undefined ? input.venueComplement : event.venueComplement ?? null},
        city = ${input.city ?? event.city},
        rsvp_enabled = ${input.rsvpEnabled ?? event.rsvpEnabled},
        rsvp_deadline = ${input.rsvpDeadline !== undefined ? input.rsvpDeadline : event.rsvpDeadline ?? null},
        check_in_notes = ${input.checkInNotes !== undefined ? input.checkInNotes : event.checkInNotes ?? null},
        gift_suggestions = ${sql.json(JSON.parse(JSON.stringify(input.giftSuggestions ?? event.giftSuggestions)))},
        updated_at = now()
      where id = ${eventId}
    `;
    return (await this.findById(eventId)) as Event;
  },
  async activateCapsule(eventId, _actorUserId, tier: Exclude<PlanTier, "free">) {
    const sql = getSql();
    const plan = PLANS[tier];
    const storageLimitBytes = tier === "family" ? 0 : bytesFromGb(plan.storageGb);
    await sql`
      update events set
        plan_tier = ${plan.tier},
        storage_limit_bytes = ${storageLimitBytes},
        capsule_activated_at = now(),
        updated_at = now()
      where id = ${eventId}
    `;
    await sql`update screen_settings set enabled = true, updated_at = now() where event_id = ${eventId}`;
    return (await this.findById(eventId)) as Event;
  },
  async setCoverImage(eventId, _actorUserId, input) {
    const sql = getSql();
    await sql`
      update events set
        cover_image_url = ${input.coverImageUrl},
        cover_source = ${input.coverSource ?? null},
        ai_cover_pending_urls = null,
        updated_at = now()
      where id = ${eventId}
    `;
    return (await this.findById(eventId)) as Event;
  },
  async incrementAiCoverUsage(eventId, _actorUserId, type) {
    const sql = getSql();
    if (type === "generation") {
      await sql`
        update events set ai_cover_generations_count = ai_cover_generations_count + 1, updated_at = now()
        where id = ${eventId}
      `;
    } else {
      await sql`
        update events set ai_cover_edits_count = ai_cover_edits_count + 1, updated_at = now()
        where id = ${eventId}
      `;
    }
    return (await this.findById(eventId)) as Event;
  },
  async tryReserveAiCoverUsage(eventId, _actorUserId, type, maxAllowed) {
    const sql = getSql();
    const rows =
      type === "generation"
        ? await sql`
            update events
            set ai_cover_generations_count = ai_cover_generations_count + 1, updated_at = now()
            where id = ${eventId}
              and ai_cover_generations_count < ${maxAllowed}
            returning id
          `
        : await sql`
            update events
            set ai_cover_edits_count = ai_cover_edits_count + 1, updated_at = now()
            where id = ${eventId}
              and ai_cover_edits_count < ${maxAllowed}
            returning id
          `;
    return Boolean(rows[0]);
  },
  async refundAiCoverUsage(eventId, _actorUserId, type) {
    const sql = getSql();
    if (type === "generation") {
      await sql`
        update events
        set ai_cover_generations_count = greatest(0, ai_cover_generations_count - 1), updated_at = now()
        where id = ${eventId}
      `;
    } else {
      await sql`
        update events
        set ai_cover_edits_count = greatest(0, ai_cover_edits_count - 1), updated_at = now()
        where id = ${eventId}
      `;
    }
    return (await this.findById(eventId)) as Event;
  },
  async purchaseAiCoverPack(eventId, _actorUserId) {
    const sql = getSql();
    await sql`
      update events set
        ai_cover_pack_bonus_generations = ai_cover_pack_bonus_generations + 2,
        ai_cover_pack_bonus_edits = ai_cover_pack_bonus_edits + 2,
        updated_at = now()
      where id = ${eventId}
    `;
    return (await this.findById(eventId)) as Event;
  },
  async setAiCoverPendingUrls(eventId, urls) {
    const sql = getSql();
    await sql`
      update events set ai_cover_pending_urls = ${sql.json(urls)}, updated_at = now()
      where id = ${eventId}
    `;
    return (await this.findById(eventId)) as Event;
  },
  async selectAiCoverVersion(eventId, _actorUserId, coverImageUrl) {
    const sql = getSql();
    await sql`
      update events set
        cover_image_url = ${coverImageUrl},
        cover_source = 'ai',
        ai_cover_pending_urls = null,
        updated_at = now()
      where id = ${eventId}
    `;
    return (await this.findById(eventId)) as Event;
  },
  async setInviteCopy(eventId, _actorUserId, inviteCopy) {
    await this.writeInviteCopy(eventId, inviteCopy);
    return (await this.findById(eventId)) as Event;
  },
  async writeInviteCopy(eventId, inviteCopy) {
    const sql = getSql();
    await sql`
      update events set invite_copy = ${sql.json(inviteCopy)}, updated_at = now()
      where id = ${eventId}
    `;
  },
  async setHostPhoto(eventId, _actorUserId, hostPhotoUrl) {
    const sql = getSql();
    await sql`
      update events set host_photo_url = ${hostPhotoUrl}, updated_at = now()
      where id = ${eventId}
    `;
    return (await this.findById(eventId)) as Event;
  },
  async incrementAiTextUsage(eventId, _actorUserId, type) {
    const sql = getSql();
    if (type === "generation") {
      await sql`
        update events set ai_text_generations_count = ai_text_generations_count + 1, updated_at = now()
        where id = ${eventId}
      `;
    } else {
      await sql`
        update events set ai_text_edits_count = ai_text_edits_count + 1, updated_at = now()
        where id = ${eventId}
      `;
    }
    return (await this.findById(eventId)) as Event;
  },
  async setVisibility(eventId, visibility) {
    const sql = getSql();
    await sql`update events set visibility = ${visibility}, updated_at = now() where id = ${eventId}`;
    return (await this.findById(eventId)) as Event;
  },
  async updatePixSettings(eventId, _actorUserId, input) {
    const sql = getSql();
    if (!input) {
      await sql`delete from pix_settings where event_id = ${eventId}`;
      return (await this.findById(eventId)) as Event;
    }
    const goalCents = input.goalAmount ?? input.suggestedAmount;
    await sql`
      insert into pix_settings (event_id, enabled, receiver_name, key_encrypted, suggested_amount_cents, min_per_person_cents, message)
      values (
        ${eventId}, ${input.enabled}, ${input.receiverName}, ${input.key},
        ${goalCents ? Math.round(goalCents * 100) : null},
        ${input.minPerPerson ? Math.round(input.minPerPerson * 100) : null},
        ${input.message ?? null}
      )
      on conflict (event_id) do update set
        enabled = excluded.enabled,
        receiver_name = excluded.receiver_name,
        key_encrypted = excluded.key_encrypted,
        suggested_amount_cents = excluded.suggested_amount_cents,
        min_per_person_cents = excluded.min_per_person_cents,
        message = excluded.message,
        updated_at = now()
    `;
    return (await this.findById(eventId)) as Event;
  },
  async updateScreenSettings(eventId, _actorUserId, input) {
    const sql = getSql();
    await sql`
      insert into screen_settings (
        event_id, enabled, token_hash, paused, show_qr_code, show_videos, show_messages
      )
      values (
        ${eventId}, ${input.enabled}, ${input.token}, ${input.paused}, ${input.showQrCode},
        ${input.showVideos}, ${input.showMessages}
      )
      on conflict (event_id) do update set
        enabled = excluded.enabled,
        paused = excluded.paused,
        show_qr_code = excluded.show_qr_code,
        show_videos = excluded.show_videos,
        show_messages = excluded.show_messages,
        updated_at = now()
    `;
    return (await this.findById(eventId)) as Event;
  }
};

export const postgresMembers: MemberRepository = {
  async findMembership(eventId, userId) {
    const sql = getSql();
    const rows = await sql`select * from event_members where event_id = ${eventId} and user_id = ${userId} limit 1`;
    return rows[0] ? rowToMember(rows[0]) : null;
  },
  async listByEvent(eventId) {
    const sql = getSql();
    const rows = await sql`select * from event_members where event_id = ${eventId} order by joined_at desc`;
    return rows.map(rowToMember);
  },
  async confirmRsvp(eventId, userId) {
    const sql = getSql();
    const rows = await sql`
      update event_members set rsvp_status = 'confirmed', updated_at = now()
      where event_id = ${eventId} and user_id = ${userId}
      returning *
    `;
    if (!rows[0]) throw new Error("MEMBER_NOT_FOUND");
    return rowToMember(rows[0]);
  },
  async ensureGuestMembership(eventId, userId) {
    const sql = getSql();
    const existing = await sql`select * from event_members where event_id = ${eventId} and user_id = ${userId} limit 1`;
    if (existing[0]) {
      const rows = await sql`
        update event_members set rsvp_status = 'confirmed', access_status = 'active', updated_at = now()
        where event_id = ${eventId} and user_id = ${userId}
        returning *
      `;
      return rowToMember(rows[0]);
    }
    const rows = await sql`
      insert into event_members (event_id, user_id, role, rsvp_status)
      values (${eventId}, ${userId}, 'guest', 'confirmed')
      returning *
    `;
    return rowToMember(rows[0]);
  },
  async blockGuest(eventId, userId, actorUserId) {
    const sql = getSql();
    const rows = await sql.begin(async (tx) => {
      const updated = await tx`
        update event_members
        set access_status = 'blocked', blocked_at = now(), blocked_by_user_id = ${actorUserId}, updated_at = now()
        where event_id = ${eventId} and user_id = ${userId}
        returning *
      `;
      await tx`
        update media_items
        set status = 'archived', visible_on_screen = false, archived_at = now(), updated_at = now()
        where event_id = ${eventId} and user_id = ${userId} and status = 'published'
      `;
      return updated;
    });
    if (!rows[0]) throw new Error("MEMBER_NOT_FOUND");
    return rowToMember(rows[0]);
  },
  async unblockGuest(eventId, userId) {
    const sql = getSql();
    const rows = await sql`
      update event_members
      set access_status = 'active', blocked_at = null, blocked_by_user_id = null, updated_at = now()
      where event_id = ${eventId} and user_id = ${userId}
      returning *
    `;
    if (!rows[0]) throw new Error("MEMBER_NOT_FOUND");
    return rowToMember(rows[0]);
  }
};

export const postgresMedia: MediaRepository = {
  async listPublishedByEvent(eventId) {
    const sql = getSql();
    const rows = await sql`
      select m.*, coalesce(m.author_display_name, u.name) as author_name
      from media_items m
      join users u on u.id = m.user_id
      where m.event_id = ${eventId} and m.status = 'published'
      order by m.created_at desc
    `;
    return rows.map(rowToMedia);
  },
  async findById(mediaId) {
    const sql = getSql();
    const rows = await sql`
      select m.*, u.name as author_name
      from media_items m
      join users u on u.id = m.user_id
      where m.id = ${mediaId}
      limit 1
    `;
    return rows[0] ? rowToMedia(rows[0]) : null;
  },
  async create(input: CreateMediaInput) {
    const sql = getSql();
    const byteSize = input.byteSize ?? 0;
    const rows = await sql.begin(async (tx) => {
      const inserted = await tx`
        insert into media_items (
          event_id, user_id, guest_rsvp_id, author_display_name, type, r2_key, url, thumbnail_url, text, caption, byte_size
        )
        values (
          ${input.eventId}, ${input.userId}, ${input.guestRsvpId ?? null}, ${input.authorDisplayName ?? null},
          ${input.type}, ${input.r2Key ?? null}, ${input.url ?? null},
          ${input.thumbnailUrl ?? null}, ${input.text ?? null}, ${input.caption ?? null}, ${byteSize}
        )
        returning *
      `;
      if (byteSize > 0) {
        await tx`
          update events
          set storage_used_bytes = storage_used_bytes + ${byteSize}, updated_at = now()
          where id = ${input.eventId}
        `;
      }
      return inserted;
    });
    const ownerId = await postgresEvents.findOwnerId(input.eventId);
    if (ownerId) {
      await postgresSubscriptions.syncSharedStorageUsed(ownerId);
    }
    const user = await postgresUsers.findById(input.userId);
    return rowToMedia({
      ...rows[0],
      author_name: input.authorDisplayName ?? user?.name ?? "Convidado"
    });
  },
  async archive(mediaId) {
    const sql = getSql();
    const rows = await sql`
      update media_items
      set status = 'archived', visible_on_screen = false, archived_at = now(), updated_at = now()
      where id = ${mediaId}
      returning *
    `;
    if (!rows[0]) throw new Error("MEDIA_NOT_FOUND");
    return rowToMedia(rows[0]);
  },
  async archiveByUser(eventId, userId) {
    const sql = getSql();
    const rows = await sql`
      update media_items
      set status = 'archived', visible_on_screen = false, archived_at = now(), updated_at = now()
      where event_id = ${eventId} and user_id = ${userId} and status = 'published'
      returning id
    `;
    return rows.length;
  },
  async delete(mediaId) {
    const sql = getSql();
    const row = await sql.begin(async (tx) => {
      const rows = await tx`
        update media_items
        set status = 'deleted', visible_on_screen = false, deleted_at = now(), updated_at = now()
        where id = ${mediaId} and status <> 'deleted'
        returning event_id, byte_size
      `;
      const deleted = rows[0];
      if (deleted && Number(deleted.byte_size ?? 0) > 0) {
        await tx`
          update events
          set storage_used_bytes = greatest(0, storage_used_bytes - ${Number(deleted.byte_size)}), updated_at = now()
          where id = ${String(deleted.event_id)}
        `;
      }
      return deleted;
    });
    const eventId = row?.event_id ? String(row.event_id) : null;
    if (eventId) {
      const ownerId = await postgresEvents.findOwnerId(eventId);
      if (ownerId) {
        await postgresSubscriptions.syncSharedStorageUsed(ownerId);
      }
    }
  },
  async setScreenVisibility(mediaId, visible) {
    const sql = getSql();
    const rows = await sql`
      update media_items set visible_on_screen = ${visible}, updated_at = now()
      where id = ${mediaId}
      returning *
    `;
    if (!rows[0]) throw new Error("MEDIA_NOT_FOUND");
    return rowToMedia(rows[0]);
  }
};

export const postgresLikes: LikeRepository = {
  async toggleLike(eventId, mediaId, userId) {
    const sql = getSql();
    return sql.begin(async (tx) => {
      const existing = await tx`
        select 1 from media_likes where event_id = ${eventId} and media_id = ${mediaId} and user_id = ${userId}
      `;
      if (existing[0]) {
        await tx`delete from media_likes where event_id = ${eventId} and media_id = ${mediaId} and user_id = ${userId}`;
        const rows = await tx`
          update media_items set likes_count = greatest(0, likes_count - 1)
          where id = ${mediaId} and event_id = ${eventId}
          returning likes_count
        `;
        return { liked: false, likesCount: Number(rows[0]?.likes_count ?? 0) };
      }

      await tx`
        insert into media_likes (event_id, media_id, user_id)
        values (${eventId}, ${mediaId}, ${userId})
      `;
      const rows = await tx`
        update media_items set likes_count = likes_count + 1
        where id = ${mediaId} and event_id = ${eventId}
        returning likes_count
      `;
      return { liked: true, likesCount: Number(rows[0]?.likes_count ?? 0) };
    });
  },
  async toggleGuestLike(eventId, mediaId, guestRsvpId) {
    const sql = getSql();
    try {
      return await sql.begin(async (tx) => {
        const existing = await tx`
          select 1 from mural_guest_likes
          where event_id = ${eventId} and media_id = ${mediaId} and guest_rsvp_id = ${guestRsvpId}
        `;
        if (existing[0]) {
          await tx`
            delete from mural_guest_likes
            where event_id = ${eventId} and media_id = ${mediaId} and guest_rsvp_id = ${guestRsvpId}
          `;
          const rows = await tx`
            update media_items set likes_count = greatest(0, likes_count - 1)
            where id = ${mediaId} and event_id = ${eventId}
            returning likes_count
          `;
          return { liked: false, likesCount: Number(rows[0]?.likes_count ?? 0) };
        }
        await tx`
          insert into mural_guest_likes (event_id, media_id, guest_rsvp_id)
          values (${eventId}, ${mediaId}, ${guestRsvpId})
        `;
        const rows = await tx`
          update media_items set likes_count = likes_count + 1
          where id = ${mediaId} and event_id = ${eventId}
          returning likes_count
        `;
        return { liked: true, likesCount: Number(rows[0]?.likes_count ?? 0) };
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      if (!/mural_guest_likes|relation.*does not exist/i.test(message)) throw err;
      return { liked: false, likesCount: 0 };
    }
  }
};

function rowToMuralAccessRequest(row: Record<string, unknown>): MuralAccessRequest {
  return {
    id: String(row.id),
    eventId: String(row.event_id),
    guestFirstName: String(row.guest_first_name),
    guestLastName: String(row.guest_last_name),
    guestEmail: String(row.guest_email),
    phone: row.phone ? String(row.phone) : undefined,
    status: row.status === "approved" || row.status === "denied" ? row.status : "pending",
    createdAt: new Date(String(row.created_at)).toISOString()
  };
}

export const postgresMuralAccess: MuralAccessRepository = {
  async createCode(input) {
    const sql = getSql();
    await sql`
      insert into mural_access_codes (event_id, guest_rsvp_id, email, code_hash, expires_at)
      values (${input.eventId}, ${input.guestRsvpId}, ${input.email}, ${input.codeHash}, ${input.expiresAt})
    `;
  },
  async findLatestCode(eventId, email) {
    const sql = getSql();
    const rows = await sql`
      select code_hash, expires_at, guest_rsvp_id
      from mural_access_codes
      where event_id = ${eventId} and lower(email) = lower(${email})
      order by created_at desc
      limit 1
    `;
    if (!rows[0]) return null;
    return {
      codeHash: String(rows[0].code_hash),
      expiresAt: new Date(String(rows[0].expires_at)).toISOString(),
      guestRsvpId: String(rows[0].guest_rsvp_id)
    };
  },
  async createAccessRequest(input) {
    const sql = getSql();
    const rows = await sql`
      insert into mural_access_requests (event_id, guest_first_name, guest_last_name, guest_email, phone)
      values (${input.eventId}, ${input.guestFirstName}, ${input.guestLastName}, ${input.guestEmail}, ${input.phone ?? null})
      returning *
    `;
    return rowToMuralAccessRequest(rows[0]);
  },
  async listAccessRequests(eventId) {
    const sql = getSql();
    const rows = await sql`
      select * from mural_access_requests where event_id = ${eventId} order by created_at desc
    `;
    return rows.map(rowToMuralAccessRequest);
  },
  async updateAccessRequestStatus(eventId, requestId, status) {
    const sql = getSql();
    const rows = await sql`
      update mural_access_requests
      set status = ${status}, updated_at = now()
      where id = ${requestId} and event_id = ${eventId}
      returning *
    `;
    if (!rows[0]) throw new Error("REQUEST_NOT_FOUND");
    return rowToMuralAccessRequest(rows[0]);
  }
};

function parseCompanionNames(row: Record<string, unknown>): string[] {
  const raw = row.companion_names;
  if (Array.isArray(raw)) {
    return raw.map((item) => String(item).trim()).filter(Boolean);
  }
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) return parsed.map((item) => String(item).trim()).filter(Boolean);
    } catch {
      /* ignore */
    }
  }
  const legacy = row.companion_name ? String(row.companion_name).trim() : "";
  return legacy ? [legacy] : [];
}

function rowToGuestRsvp(row: Record<string, unknown>): GuestRsvp {
  const companionNames = parseCompanionNames(row);
  const companionsDetail = parseCompanionsDetail(row.companions_detail);
  const guestFirstName = row.guest_first_name ? String(row.guest_first_name) : undefined;
  const guestLastName = row.guest_last_name ? String(row.guest_last_name) : undefined;
  return {
    id: String(row.id),
    eventId: String(row.event_id),
    guestName: String(row.guest_name),
    guestFirstName,
    guestLastName,
    guestEmail: row.guest_email ? String(row.guest_email) : undefined,
    phone: row.phone ? String(row.phone) : undefined,
    companionName: companionNames[0],
    companionNames,
    companionsDetail: companionsDetail.length ? companionsDetail : undefined,
    rsvpStatus: row.rsvp_status === "declined" ? "declined" : "confirmed",
    pixContributedAmount:
      row.pix_contributed_amount != null ? Number(row.pix_contributed_amount) : undefined,
    termsAcceptedAt: row.terms_accepted_at
      ? new Date(String(row.terms_accepted_at)).toISOString()
      : undefined,
    wantsCapsule: Boolean(row.wants_capsule),
    checkedInAt: row.checked_in_at ? new Date(String(row.checked_in_at)).toISOString() : undefined,
    confirmedAt: new Date(String(row.confirmed_at)).toISOString()
  };
}

export const postgresGuestRsvps: GuestRsvpRepository = {
  async create(input: CreateGuestRsvpInput): Promise<GuestRsvp> {
    const sql = getSql();
    const companions = (input.companionNames ?? []).map((name) => name.trim()).filter(Boolean);
    const legacyName = companions[0] ?? input.companionName?.trim();

    const companionsDetail = input.companionsDetail ?? [];
    const detailNames = companionsDetail.map((item) => item.name.trim()).filter(Boolean);
    const mergedNames = detailNames.length ? detailNames : companions;
    const legacy = mergedNames[0] ?? legacyName;

    try {
      const rows = await sql`
        insert into guest_rsvps (
          event_id, guest_name, guest_first_name, guest_last_name, guest_email, phone,
          companion_name, companion_names, companions_detail, rsvp_status,
          pix_contributed_amount, terms_accepted_at, wants_capsule
        )
        values (
          ${input.eventId},
          ${input.guestName},
          ${input.guestFirstName ?? null},
          ${input.guestLastName ?? null},
          ${input.guestEmail ?? null},
          ${input.phone ?? null},
          ${legacy ?? null},
          ${JSON.stringify(mergedNames)}::jsonb,
          ${JSON.stringify(companionsDetail)}::jsonb,
          ${input.rsvpStatus ?? "confirmed"},
          ${input.pixContributedAmount ?? null},
          ${input.termsAcceptedAt ?? null},
          ${input.wantsCapsule}
        )
        returning *
      `;
      return rowToGuestRsvp(rows[0]);
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      if (!/companion_names|companion_name|column|guest_email|rsvp_status|companions_detail/.test(message)) {
        throw err;
      }
      const rows = await sql`
        insert into guest_rsvps (event_id, guest_name, phone, companion_name, companion_names, wants_capsule)
        values (
          ${input.eventId},
          ${input.guestName},
          ${input.phone ?? null},
          ${legacy ?? null},
          ${JSON.stringify(mergedNames)}::jsonb,
          ${input.wantsCapsule}
        )
        returning *
      `;
      return rowToGuestRsvp(rows[0]);
    }
  },
  async sumPixContributions(eventId: string): Promise<number> {
    const sql = getSql();
    try {
      const rows = await sql`
        select coalesce(sum(pix_contributed_amount), 0)::numeric as total
        from guest_rsvps
        where event_id = ${eventId} and rsvp_status = 'confirmed'
      `;
      return Number(rows[0]?.total ?? 0);
    } catch {
      return 0;
    }
  },
  async findConfirmedByEmail(eventId, email) {
    const sql = getSql();
    const rows = await sql`
      select * from guest_rsvps
      where event_id = ${eventId}
        and lower(guest_email) = lower(${email})
        and rsvp_status = 'confirmed'
      order by confirmed_at desc
      limit 1
    `;
    return rows[0] ? rowToGuestRsvp(rows[0]) : null;
  },
  async listByEvent(eventId: string): Promise<GuestRsvp[]> {
    const sql = getSql();
    const rows = await sql`
      select * from guest_rsvps where event_id = ${eventId} order by confirmed_at desc
    `;
    return rows.map(rowToGuestRsvp);
  },
  async findById(eventId, rsvpId) {
    const sql = getSql();
    const rows = await sql`
      select * from guest_rsvps
      where event_id = ${eventId} and id = ${rsvpId}
      limit 1
    `;
    return rows[0] ? rowToGuestRsvp(rows[0]) : null;
  },
  async updateCompanions(eventId, rsvpId, companionNames) {
    const sql = getSql();
    const names = companionNames.map((name) => name.trim()).filter(Boolean);
    const existing = await this.findById(eventId, rsvpId);
    if (!existing) throw new Error("RSVP_NOT_FOUND");
    if (existing.checkedInAt) throw new Error("ALREADY_CHECKED_IN");

    try {
      const rows = await sql`
        update guest_rsvps
        set companion_names = ${JSON.stringify(names)}::jsonb,
            companion_name = ${names[0] ?? null}
        where id = ${rsvpId} and event_id = ${eventId}
        returning *
      `;
      if (!rows[0]) throw new Error("RSVP_NOT_FOUND");
      return rowToGuestRsvp(rows[0]);
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      if (!/companion_names|companion_name|column/.test(message)) throw err;
      const rows = await sql`
        update guest_rsvps
        set companion_name = ${names[0] ?? null}
        where id = ${rsvpId} and event_id = ${eventId}
        returning *
      `;
      if (!rows[0]) throw new Error("RSVP_NOT_FOUND");
      return rowToGuestRsvp(rows[0]);
    }
  },
  async checkIn(eventId, rsvpId, _actorUserId) {
    const sql = getSql();
    try {
      const rows = await sql`
        update guest_rsvps set checked_in_at = now()
        where id = ${rsvpId} and event_id = ${eventId}
        returning *
      `;
      if (!rows[0]) throw new Error("RSVP_NOT_FOUND");
      return rowToGuestRsvp(rows[0]);
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      if (message === "RSVP_NOT_FOUND") throw err;
      if (/guest_rsvps|relation.*does not exist/i.test(message)) throw err;
      const rows = await sql`
        update guest_rsvps set checked_in_at = now()
        where id = ${rsvpId} and event_id = ${eventId}
        returning id, event_id, guest_name, phone, wants_capsule, checked_in_at, confirmed_at
      `;
      if (!rows[0]) throw new Error("RSVP_NOT_FOUND");
      return rowToGuestRsvp(rows[0]);
    }
  },
  async undoCheckIn(eventId, rsvpId, _actorUserId) {
    const sql = getSql();
    const rows = await sql`
      update guest_rsvps set checked_in_at = null
      where id = ${rsvpId} and event_id = ${eventId}
      returning *
    `;
    if (!rows[0]) throw new Error("RSVP_NOT_FOUND");
    return rowToGuestRsvp(rows[0]);
  }
};

function rowToSubscription(row: Record<string, unknown>): UserSubscription {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    planTier: "family",
    status: row.status as UserSubscription["status"],
    currentPeriodStart: new Date(String(row.current_period_start)).toISOString(),
    currentPeriodEnd: new Date(String(row.current_period_end)).toISOString(),
    eventsUsedThisPeriod: Number(row.events_used_this_period ?? 0),
    sharedStorageUsedGb: Number(row.shared_storage_used_bytes ?? 0) / 1024 / 1024 / 1024,
    extraStorageGb: Number(row.extra_storage_bytes ?? 0) / 1024 / 1024 / 1024
  };
}

export const postgresSubscriptions: SubscriptionRepository = {
  async findActiveByUser(userId) {
    const sql = getSql();
    const rows = await sql`
      select * from user_subscriptions
      where user_id = ${userId}
        and status = 'active'
        and current_period_start <= now()
        and current_period_end >= now()
      order by created_at desc
      limit 1
    `;
    return rows[0] ? rowToSubscription(rows[0]) : null;
  },
  async activateFamilyPlan(userId) {
    const sql = getSql();
    const existing = await this.findActiveByUser(userId);
    if (existing) return existing;
    const rows = await sql`
      insert into user_subscriptions (
        user_id, plan_tier, status, current_period_start, current_period_end,
        events_used_this_period, shared_storage_used_bytes
      )
      values (
        ${userId}, 'family', 'active', now(), now() + interval '1 year', 0, 0
      )
      returning *
    `;
    return rowToSubscription(rows[0]);
  },
  async consumeEventSlot(userId) {
    const sql = getSql();
    const rows = await sql`
      update user_subscriptions
      set events_used_this_period = events_used_this_period + 1, updated_at = now()
      where user_id = ${userId}
        and status = 'active'
        and current_period_start <= now()
        and current_period_end >= now()
      returning *
    `;
    if (!rows[0]) throw new Error("SUBSCRIPTION_NOT_FOUND");
    return rowToSubscription(rows[0]);
  },
  async addExtraStorage(userId, gb) {
    const sql = getSql();
    const bytes = bytesFromGb(gb);
    const rows = await sql`
      update user_subscriptions
      set extra_storage_bytes = extra_storage_bytes + ${bytes}, updated_at = now()
      where user_id = ${userId}
        and status = 'active'
        and current_period_start <= now()
        and current_period_end >= now()
      returning *
    `;
    if (!rows[0]) throw new Error("SUBSCRIPTION_NOT_FOUND");
    return rowToSubscription(rows[0]);
  },
  async syncSharedStorageUsed(ownerId) {
    const sql = getSql();
    const total = await postgresEvents.sumFamilyStorageUsedBytes(ownerId);
    await sql`
      update user_subscriptions
      set shared_storage_used_bytes = ${total}, updated_at = now()
      where user_id = ${ownerId}
        and status = 'active'
        and current_period_start <= now()
        and current_period_end >= now()
    `;
  }
};

export const postgresAiCoverArtifacts: AiCoverArtifactRepository = {
  async createReserved(input) {
    const sql = getSql();
    const rows = await sql`
      insert into ai_cover_artifacts (
        event_id, user_id, usage_type, prompt_version, request_summary, status
      ) values (
        ${input.eventId},
        ${input.userId},
        ${input.usageType},
        ${input.promptVersion},
        ${sql.json(JSON.parse(JSON.stringify(input.requestSummary)))},
        'reserved'
      )
      returning id
    `;
    return String(rows[0].id);
  },
  async complete(artifactId, input) {
    const sql = getSql();
    await sql`
      update ai_cover_artifacts set
        status = 'completed',
        image_data_url = ${input.imageDataUrl},
        artifact = ${sql.json({
          prompt: input.prompt,
          model: input.model,
          size: input.size,
          quality: input.quality,
          ...input.artifact
        })},
        completed_at = now()
      where id = ${artifactId}
    `;
  },
  async delete(artifactId) {
    const sql = getSql();
    await sql`delete from ai_cover_artifacts where id = ${artifactId}`;
  }
};

import { BILLING_AUDIT_ACTIONS } from "@/lib/billing/payment-history";

export const postgresAudit: AuditRepository = {
  async record(input) {
    const sql = getSql();
    await sql`
      insert into audit_logs (actor_user_id, event_id, action, target_type, target_id, metadata)
      values (
        ${input.actorUserId}, ${input.eventId}, ${input.action}, ${input.targetType},
        ${input.targetId ?? null}, ${sql.json(JSON.parse(JSON.stringify(input.metadata ?? {})))}
      )
    `;
  },
  async listBillingByActorUserId(userId, limit = 50) {
    const sql = getSql();
    const rows = await sql`
      select id, actor_user_id, event_id, action, target_type, target_id, metadata, created_at
      from audit_logs
      where actor_user_id = ${userId}
        and action in ${sql(BILLING_AUDIT_ACTIONS)}
      order by created_at desc
      limit ${limit}
    `;
    return rows.map((row) => ({
      id: String(row.id),
      actorUserId: row.actor_user_id ? String(row.actor_user_id) : null,
      eventId: row.event_id ? String(row.event_id) : null,
      action: String(row.action),
      targetType: String(row.target_type),
      targetId: row.target_id ? String(row.target_id) : null,
      metadata: (row.metadata as Record<string, unknown>) ?? {},
      createdAt: new Date(String(row.created_at)).toISOString()
    }));
  }
};

function rowToGuestMessage(row: Record<string, unknown>): GuestMessage {
  return {
    id: String(row.id),
    eventId: String(row.event_id),
    authorName: String(row.author_name),
    body: String(row.body),
    visibility: row.visibility === "private" ? "private" : "public",
    createdAt: new Date(String(row.created_at)).toISOString()
  };
}

export const postgresGuestMessages: GuestMessageRepository = {
  async create(input) {
    const sql = getSql();
    const rows = await sql`
      insert into guest_messages (event_id, author_name, body, visibility)
      values (${input.eventId}, ${input.authorName}, ${input.body}, ${input.visibility})
      returning *
    `;
    return rowToGuestMessage(rows[0]);
  },
  async listPublicByEvent(eventId) {
    const sql = getSql();
    const rows = await sql`
      select * from guest_messages
      where event_id = ${eventId} and visibility = 'public'
      order by created_at desc
    `;
    return rows.map(rowToGuestMessage);
  }
};

export const postgresRepositories = {
  users: postgresUsers,
  events: postgresEvents,
  members: postgresMembers,
  media: postgresMedia,
  likes: postgresLikes,
  audit: postgresAudit,
  aiCoverArtifacts: postgresAiCoverArtifacts,
  guestRsvps: postgresGuestRsvps,
  guestMessages: postgresGuestMessages,
  muralAccess: postgresMuralAccess,
  subscriptions: postgresSubscriptions
};
