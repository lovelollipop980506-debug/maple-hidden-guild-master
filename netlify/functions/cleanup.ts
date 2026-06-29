import { createClient } from "@supabase/supabase-js";

/**
 * Netlify Scheduled Function — runs daily.
 * Deletes chat messages (and their re-hosted images) older than the retention
 * window, so Supabase Storage/DB usage stays bounded and within the free tier.
 *
 * Retention window is configurable via RETENTION_DAYS (default 90).
 */

const CHAT_BUCKET = process.env.SUPABASE_CHAT_BUCKET ?? "chat-images";
const RETENTION_DAYS = Number(process.env.RETENTION_DAYS ?? "90");

function supa() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

/** Extract the storage object path from a Supabase public URL. */
function pathFromPublicUrl(url: string): string | null {
  const marker = `/${CHAT_BUCKET}/`;
  const i = url.indexOf(marker);
  return i === -1 ? null : url.slice(i + marker.length);
}

export default async () => {
  if (!Number.isFinite(RETENTION_DAYS) || RETENTION_DAYS <= 0) {
    return new Response(JSON.stringify({ ok: true, skipped: "retention disabled" }));
  }

  const db = supa();
  const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();

  // Find expired messages (paginate to stay within limits).
  const { data: old, error } = await db
    .from("messages")
    .select("id, image_url")
    .lt("discord_created_at", cutoff)
    .limit(1000);

  if (error) {
    console.error("[cleanup] select error:", error.message);
    return new Response(JSON.stringify({ ok: false, error: error.message }), { status: 500 });
  }
  if (!old?.length) {
    return new Response(JSON.stringify({ ok: true, deleted: 0 }));
  }

  // Remove re-hosted images from storage.
  const paths = old
    .map((m) => (m.image_url ? pathFromPublicUrl(m.image_url) : null))
    .filter((p): p is string => !!p);
  if (paths.length) {
    const { error: rmErr } = await db.storage.from(CHAT_BUCKET).remove(paths);
    if (rmErr) console.error("[cleanup] storage remove error:", rmErr.message);
  }

  // Delete the message rows.
  const ids = old.map((m) => m.id);
  const { error: delErr } = await db.from("messages").delete().in("id", ids);
  if (delErr) {
    console.error("[cleanup] delete error:", delErr.message);
    return new Response(JSON.stringify({ ok: false, error: delErr.message }), { status: 500 });
  }

  console.log(`[cleanup] removed ${ids.length} messages, ${paths.length} images (>${RETENTION_DAYS}d)`);
  return new Response(JSON.stringify({ ok: true, deleted: ids.length, images: paths.length }), {
    headers: { "content-type": "application/json" },
  });
};

export const config = { schedule: "0 4 * * *" }; // daily at 04:00 UTC
