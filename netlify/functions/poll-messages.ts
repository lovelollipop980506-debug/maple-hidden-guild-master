import { createClient } from "@supabase/supabase-js";

/**
 * Netlify Scheduled Function — every 5 minutes.
 * For each active form with intake='discord', poll its channel and insert new
 * messages as form_submissions (source='discord', status='pending') for review.
 * Images are re-hosted to Supabase Storage (Discord URLs expire ~24h).
 */

const API = "https://discord.com/api/v10";
const CHAT_BUCKET = process.env.SUPABASE_CHAT_BUCKET ?? "chat-images";
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

type DiscordMessage = {
  id: string;
  channel_id: string;
  author: { id: string; username: string; global_name?: string | null };
  content: string;
  attachments: Array<{ id: string; url: string; filename: string; content_type?: string }>;
  timestamp: string;
};

type Att = { url: string; filename: string; content_type?: string };

function supa() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function firstImage(atts: Att[]): Att | undefined {
  return atts.find((a) => a.content_type?.startsWith("image/") || /\.(png|jpe?g|gif|webp)$/i.test(a.filename));
}

async function fetchAfter(channelId: string, afterId?: string): Promise<DiscordMessage[]> {
  const params = new URLSearchParams({ limit: "100" });
  if (afterId) params.set("after", afterId);
  const res = await fetch(`${API}/channels/${channelId}/messages?${params.toString()}`, {
    headers: { Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}` },
  });
  if (!res.ok) {
    console.error(`[poll] channel ${channelId} -> ${res.status}`);
    return [];
  }
  return (await res.json()) as DiscordMessage[];
}

async function rehostImage(db: ReturnType<typeof supa>, messageId: string, att: Att): Promise<string | null> {
  try {
    const res = await fetch(att.url);
    if (!res.ok) return null;
    const buf = new Uint8Array(await res.arrayBuffer());
    if (buf.byteLength > MAX_IMAGE_BYTES) return null;
    const ext = (att.filename.split(".").pop() || "png").toLowerCase();
    const path = `${messageId}.${ext}`;
    const { error } = await db.storage
      .from(CHAT_BUCKET)
      .upload(path, buf, { contentType: att.content_type || `image/${ext}`, upsert: true });
    if (error) return null;
    return db.storage.from(CHAT_BUCKET).getPublicUrl(path).data.publicUrl;
  } catch {
    return null;
  }
}

export default async () => {
  const db = supa();

  // Active discord-intake forms define which channels to ingest.
  const { data: forms } = await db
    .from("forms")
    .select("id, key, discord_channel_id")
    .eq("intake", "discord")
    .eq("active", true);

  const targets = (forms ?? []).filter((f) => f.discord_channel_id);
  if (!targets.length) {
    return new Response(JSON.stringify({ ok: true, skipped: "no discord-intake forms" }));
  }

  let totalInserted = 0;

  for (const form of targets) {
    const channelId = form.discord_channel_id as string;
    const { data: cursor } = await db
      .from("poll_cursor")
      .select("last_message_id")
      .eq("channel_id", channelId)
      .maybeSingle();

    const msgs = await fetchAfter(channelId, cursor?.last_message_id ?? undefined);
    if (!msgs.length) continue;
    msgs.sort((a, b) => (BigInt(a.id) < BigInt(b.id) ? -1 : 1));

    const rows = [];
    for (const m of msgs) {
      const atts: Att[] = m.attachments.map((a) => ({
        url: a.url,
        filename: a.filename,
        content_type: a.content_type,
      }));
      const img = firstImage(atts);
      const imageUrl = img ? await rehostImage(db, m.id, img) : null;

      rows.push({
        form_id: form.id,
        form_key: form.key,
        user_id: m.author.id,
        answers: {
          content: m.content,
          image_url: imageUrl,
          author_name: m.author.global_name || m.author.username,
        },
        status: "pending",
        source: "discord",
        discord_message_id: m.id,
      });
    }

    const { error } = await db
      .from("form_submissions")
      .upsert(rows, { onConflict: "discord_message_id", ignoreDuplicates: true });
    if (error) {
      console.error(`[poll] insert error for ${channelId}:`, error.message);
      continue;
    }
    totalInserted += rows.length;

    const latestId = rows[rows.length - 1].discord_message_id;
    await db
      .from("poll_cursor")
      .upsert({ channel_id: channelId, last_message_id: latestId, updated_at: new Date().toISOString() }, {
        onConflict: "channel_id",
      });
  }

  console.log(`[poll] ingested ${totalInserted} submissions from ${targets.length} channel(s)`);
  return new Response(JSON.stringify({ ok: true, inserted: totalInserted }), {
    headers: { "content-type": "application/json" },
  });
};

export const config = { schedule: "*/5 * * * *" };
