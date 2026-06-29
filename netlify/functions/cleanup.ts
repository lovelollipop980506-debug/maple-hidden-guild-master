import { createClient } from "@supabase/supabase-js";

/**
 * Netlify Scheduled Function — daily.
 * Deletes old DISCORD-ingested submissions (the chat firehose) and their
 * re-hosted images, keeping storage/DB within the free tier.
 * Web submissions are records and are NOT auto-deleted.
 *
 * Window: RETENTION_DAYS (default 90). Set 0 to disable.
 */

const CHAT_BUCKET = process.env.SUPABASE_CHAT_BUCKET ?? "chat-images";
const RETENTION_DAYS = Number(process.env.RETENTION_DAYS ?? "90");

function supa() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

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

  const { data: old, error } = await db
    .from("form_submissions")
    .select("id, answers")
    .eq("source", "discord")
    .lt("created_at", cutoff)
    .limit(1000);

  if (error) return new Response(JSON.stringify({ ok: false, error: error.message }), { status: 500 });
  if (!old?.length) return new Response(JSON.stringify({ ok: true, deleted: 0 }));

  const paths = old
    .map((s) => {
      const url = (s.answers as { image_url?: string } | null)?.image_url;
      return url ? pathFromPublicUrl(url) : null;
    })
    .filter((p): p is string => !!p);
  if (paths.length) {
    const { error: rmErr } = await db.storage.from(CHAT_BUCKET).remove(paths);
    if (rmErr) console.error("[cleanup] storage remove error:", rmErr.message);
  }

  const ids = old.map((s) => s.id);
  const { error: delErr } = await db.from("form_submissions").delete().in("id", ids);
  if (delErr) return new Response(JSON.stringify({ ok: false, error: delErr.message }), { status: 500 });

  console.log(`[cleanup] removed ${ids.length} discord submissions, ${paths.length} images (>${RETENTION_DAYS}d)`);
  return new Response(JSON.stringify({ ok: true, deleted: ids.length, images: paths.length }), {
    headers: { "content-type": "application/json" },
  });
};

export const config = { schedule: "0 4 * * *" };
