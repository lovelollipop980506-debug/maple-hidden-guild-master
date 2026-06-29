import { createClient } from "@supabase/supabase-js";

/**
 * Netlify Scheduled Function — runs every 5 minutes.
 * Polls the configured Discord channel(s) and upserts new messages into Supabase.
 *
 * Self-contained (no @/ alias) because Netlify bundles functions separately
 * from the Next.js app.
 */

const API = "https://discord.com/api/v10";

type DiscordMessage = {
  id: string;
  channel_id: string;
  author: { id: string; username: string; global_name?: string | null };
  content: string;
  attachments: Array<{ id: string; url: string; filename: string; content_type?: string }>;
  timestamp: string;
};

const CHAT_BUCKET = process.env.SUPABASE_CHAT_BUCKET ?? "chat-images";
const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // skip anything larger to protect the free quota

function supa() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

type Att = { url: string; filename: string; content_type?: string };

function firstImage(atts: Att[]): Att | undefined {
  return atts.find(
    (a) =>
      a.content_type?.startsWith("image/") ||
      /\.(png|jpe?g|gif|webp)$/i.test(a.filename),
  );
}

/**
 * Download a (soon-to-expire) Discord image and re-host it in Supabase Storage.
 * Returns the permanent public URL, or null on failure / oversize.
 */
async function rehostImage(
  db: ReturnType<typeof supa>,
  messageId: string,
  att: Att,
): Promise<string | null> {
  try {
    const res = await fetch(att.url);
    if (!res.ok) return null;
    const buf = new Uint8Array(await res.arrayBuffer());
    if (buf.byteLength > MAX_IMAGE_BYTES) return null;

    const ext = (att.filename.split(".").pop() || "png").toLowerCase();
    const path = `${messageId}.${ext}`;
    const { error } = await db.storage
      .from(CHAT_BUCKET)
      .upload(path, buf, {
        contentType: att.content_type || `image/${ext}`,
        upsert: true,
      });
    if (error) {
      console.error(`[poll] image upload failed for ${messageId}:`, error.message);
      return null;
    }
    return db.storage.from(CHAT_BUCKET).getPublicUrl(path).data.publicUrl;
  } catch (e) {
    console.error(`[poll] rehost error for ${messageId}:`, e);
    return null;
  }
}

async function fetchAfter(channelId: string, afterId?: string): Promise<DiscordMessage[]> {
  const params = new URLSearchParams({ limit: "100" });
  if (afterId) params.set("after", afterId);
  const res = await fetch(`${API}/channels/${channelId}/messages?${params.toString()}`, {
    headers: { Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}` },
  });
  if (!res.ok) {
    console.error(`[poll] channel ${channelId} -> ${res.status} ${await res.text()}`);
    return [];
  }
  return (await res.json()) as DiscordMessage[];
}

export default async () => {
  const db = supa();
  const channelIds = (process.env.DISCORD_SOURCE_CHANNEL_IDS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  let totalInserted = 0;

  for (const channelId of channelIds) {
    const { data: cursor } = await db
      .from("poll_cursor")
      .select("last_message_id")
      .eq("channel_id", channelId)
      .maybeSingle();

    const msgs = await fetchAfter(channelId, cursor?.last_message_id ?? undefined);
    if (!msgs.length) continue;

    // Discord returns newest-first; sort ascending by snowflake id.
    msgs.sort((a, b) => (BigInt(a.id) < BigInt(b.id) ? -1 : 1));

    const rows = [];
    for (const m of msgs) {
      const atts: Att[] = m.attachments.map((a) => ({
        url: a.url,
        filename: a.filename,
        content_type: a.content_type,
      }));

      // Re-host the first image so it survives Discord's ~24h URL expiry.
      const img = firstImage(atts);
      const imageUrl = img ? await rehostImage(db, m.id, img) : null;

      rows.push({
        id: m.id,
        channel_id: m.channel_id,
        author_id: m.author.id,
        author_name: m.author.global_name || m.author.username,
        content: m.content,
        attachments: atts,
        image_url: imageUrl,
        discord_created_at: m.timestamp,
        raw: m as unknown,
      });
    }

    const { error } = await db.from("messages").upsert(rows, { onConflict: "id" });
    if (error) {
      console.error(`[poll] upsert error for ${channelId}:`, error.message);
      continue;
    }
    totalInserted += rows.length;

    const latestId = rows[rows.length - 1].id;
    await db.from("poll_cursor").upsert(
      { channel_id: channelId, last_message_id: latestId, updated_at: new Date().toISOString() },
      { onConflict: "channel_id" },
    );
  }

  console.log(`[poll] ingested ${totalInserted} messages across ${channelIds.length} channel(s)`);
  return new Response(JSON.stringify({ ok: true, inserted: totalInserted }), {
    headers: { "content-type": "application/json" },
  });
};

export const config = { schedule: "*/5 * * * *" };
