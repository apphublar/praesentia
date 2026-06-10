import { getSql } from "@/lib/db/client";
import type {
  AuditRepository,
  CreateEventInput,
  AiCoverArtifactRepository,
  CreateGuestRsvpInput,
  CreateMediaInput,
  EventRepository,
  GuestRsvpRepository,
  LikeRepository,
  MediaRepository,
  MemberRepository,
  SubscriptionRepository,
  UpdateEventInput,
  UserRepository
} from "@/lib/db/repositories";
import { bytesFromGb, PLANS } from "@/lib/plans";
import { normalizeEventType } from "@/lib/events/event-types";
import { normalizeInviteCopy } from "@/lib/events/invite-copy";
import type { Event, EventMember, EventType, GuestRsvp, InviteCopy, MediaItem, PlanTier, User, UserSubscription } from "@/types/domain";

function rowToUser(row: Record<string, unknown>): User {
  return {
    id: String(row.id),
    name: String(row.name),
    email: String(row.email),
    role: row.role as User["role"]
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
    date: String(row.date),
    startsAt: String(row.starts_at),
    endsAt: String(row.ends_at),
    venueName: String(row.venue_name),
    venueAddress: String(row.venue_address),
    city: String(row.city),
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
    authorName: String(row.author_name ?? "Convidado"),
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
    const rows = await sql`select id, name, email, role from users where id = ${id} limit 1`;
    return rows[0] ? rowToUser(rows[0]) : null;
  },
  async findByEmail(email) {
    const sql = getSql();
    const rows = await sql`select id, name, email, role from users where email = ${email} limit 1`;
    return rows[0] ? rowToUser(rows[0]) : null;
  }
};

export const postgresEvents: EventRepository = {
  async findById(id) {
    const sql = getSql();
    const rows = await sql`
      select e.*, u.name as owner_name, p.enabled as pix_enabled, p.receiver_name as pix_receiver_name,
        p.key_encrypted as pix_key_encrypted, p.suggested_amount_cents as pix_suggested_amount_cents,
        p.message as pix_message, s.enabled as screen_enabled, s.paused as screen_paused,
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
        p.message as pix_message, s.enabled as screen_enabled, s.paused as screen_paused,
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
        p.message as pix_message, s.enabled as screen_enabled, s.paused as screen_paused,
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
  async create(input: CreateEventInput) {
    const sql = getSql();
    const plan = PLANS.free;
    const slug = input.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const rows = await sql`
      insert into events (
        owner_id, slug, free_code, title, theme, event_type, host_name, date, starts_at, ends_at,
        venue_name, venue_address, city, event_format, online_meeting_url,
        plan_tier, storage_limit_bytes, retention_until
      )
      values (
        ${input.ownerId}, ${slug}, ${Math.random().toString(36).slice(2, 8)}, ${input.title},
        ${input.theme}, ${input.eventType}, ${input.hostName}, ${input.date}, ${input.startsAt},
        ${input.endsAt}, ${input.venueName}, ${input.venueAddress}, ${input.city},
        ${input.eventFormat}, ${input.onlineMeetingUrl ?? null},
        ${plan.tier}, ${bytesFromGb(plan.storageGb)}, now() + interval '36 months'
      )
      returning *
    `;
    await sql`
      insert into event_members (event_id, user_id, role, rsvp_status)
      values (${rows[0].id}, ${input.ownerId}, 'owner', 'confirmed')
    `;
    return (await this.findById(String(rows[0].id))) as Event;
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
        event_format = ${input.eventFormat ?? event.eventFormat},
        online_meeting_url = ${input.onlineMeetingUrl ?? event.onlineMeetingUrl ?? null},
        date = ${input.date ?? event.date},
        starts_at = ${input.startsAt ?? event.startsAt},
        ends_at = ${input.endsAt ?? event.endsAt},
        venue_name = ${input.venueName ?? event.venueName},
        venue_address = ${input.venueAddress ?? event.venueAddress},
        city = ${input.city ?? event.city},
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
    await sql`
      insert into pix_settings (event_id, enabled, receiver_name, key_encrypted, suggested_amount_cents, message)
      values (
        ${eventId}, ${input.enabled}, ${input.receiverName}, ${input.key},
        ${input.suggestedAmount ? Math.round(input.suggestedAmount * 100) : null}, ${input.message ?? null}
      )
      on conflict (event_id) do update set
        enabled = excluded.enabled,
        receiver_name = excluded.receiver_name,
        key_encrypted = excluded.key_encrypted,
        suggested_amount_cents = excluded.suggested_amount_cents,
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
      select m.*, u.name as author_name
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
        insert into media_items (event_id, user_id, type, r2_key, url, thumbnail_url, text, byte_size)
        values (
          ${input.eventId}, ${input.userId}, ${input.type}, ${input.r2Key ?? null}, ${input.url ?? null},
          ${input.thumbnailUrl ?? null}, ${input.text ?? null}, ${byteSize}
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
    return rowToMedia({ ...rows[0], author_name: user?.name ?? "Convidado" });
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
  }
};

function rowToGuestRsvp(row: Record<string, unknown>): GuestRsvp {
  return {
    id: String(row.id),
    eventId: String(row.event_id),
    guestName: String(row.guest_name),
    phone: row.phone ? String(row.phone) : undefined,
    companionName: row.companion_name ? String(row.companion_name) : undefined,
    wantsCapsule: Boolean(row.wants_capsule),
    checkedInAt: row.checked_in_at ? new Date(String(row.checked_in_at)).toISOString() : undefined,
    confirmedAt: new Date(String(row.confirmed_at)).toISOString()
  };
}

export const postgresGuestRsvps: GuestRsvpRepository = {
  async create(input: CreateGuestRsvpInput): Promise<GuestRsvp> {
    const sql = getSql();
    const rows = await sql`
      insert into guest_rsvps (event_id, guest_name, phone, companion_name, wants_capsule)
      values (
        ${input.eventId},
        ${input.guestName},
        ${input.phone ?? null},
        ${input.companionName ?? null},
        ${input.wantsCapsule}
      )
      returning *
    `;
    return rowToGuestRsvp(rows[0]);
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
  async checkIn(eventId, rsvpId, _actorUserId) {
    const sql = getSql();
    const rows = await sql`
      update guest_rsvps set checked_in_at = now()
      where id = ${rsvpId} and event_id = ${eventId}
      returning *
    `;
    if (!rows[0]) throw new Error("RSVP_NOT_FOUND");
    return rowToGuestRsvp(rows[0]);
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
  subscriptions: postgresSubscriptions
};
