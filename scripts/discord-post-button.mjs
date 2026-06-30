#!/usr/bin/env node
/**
 * Post a "submit" button message into a channel. Clicking it opens the form's
 * modal (handled by /api/discord/interactions, custom_id `form_open:<key>`).
 *
 * Usage:
 *   node --env-file=.env scripts/discord-post-button.mjs <formKey> <channelId>
 *
 * Needs DISCORD_BOT_TOKEN + Supabase service-role env. The bot must be in the
 * guild with "Send Messages" in the target channel. Run once per form/channel.
 */

import { createClient } from "@supabase/supabase-js";

const API = "https://discord.com/api/v10";
const [formKey, channelId] = process.argv.slice(2);

if (!formKey || !channelId) {
  console.error("Usage: node --env-file=.env scripts/discord-post-button.mjs <formKey> <channelId>");
  process.exit(1);
}

const token = process.env.DISCORD_BOT_TOKEN;
if (!token) {
  console.error("Missing DISCORD_BOT_TOKEN");
  process.exit(1);
}

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data: form, error } = await db
  .from("forms")
  .select("key, title, description, active")
  .eq("key", formKey)
  .maybeSingle();

if (error || !form) {
  console.error(`Form "${formKey}" not found.`);
  process.exit(1);
}
if (!form.active) console.warn(`Warning: form "${formKey}" is inactive — the button will reject submissions.`);

const res = await fetch(`${API}/channels/${channelId}/messages`, {
  method: "POST",
  headers: { Authorization: `Bot ${token}`, "Content-Type": "application/json" },
  body: JSON.stringify({
    embeds: [{ title: form.title, description: form.description ?? "", color: 0x5865f2 }],
    components: [
      {
        type: 1, // Action Row
        components: [
          {
            type: 2, // Button
            style: 1, // Primary
            label: `${form.title} 제출`,
            custom_id: `form_open:${form.key}`,
          },
        ],
      },
    ],
  }),
});

if (!res.ok) {
  console.error(`Failed to post (${res.status}):`, await res.text());
  process.exit(1);
}
console.log(`✅ Posted "${form.title}" button to channel ${channelId}.`);
