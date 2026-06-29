import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { can, type Capability, type Tier } from "@/lib/rbac";

/** Get the current session (or null). */
export async function getSession() {
  return auth();
}

/** Require a logged-in user; redirect to /login otherwise. */
export async function requireUser() {
  const session = await auth();
  if (!session?.user?.discordId) redirect("/login");
  return session;
}

/** Require a capability; redirect to /login (anon) or / (insufficient tier). */
export async function requireCapability(capability: Capability) {
  const session = await auth();
  if (!session?.user?.discordId) redirect("/login");
  if (!can(session.user.tier as Tier, capability)) redirect("/");
  return session;
}
