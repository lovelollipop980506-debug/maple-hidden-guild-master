export type Tier = "admin" | "reviewer" | "member" | "guest";
export type SubmissionStatus = "pending" | "approved" | "rejected";

export const TIER_RANK: Record<Tier, number> = { admin: 3, reviewer: 2, member: 1, guest: 0 };
export function tierAtLeast(tier: Tier | undefined | null, required: Tier): boolean {
  return !!tier && TIER_RANK[tier] >= TIER_RANK[required];
}

export interface Me {
  discordId: string;
  name: string | null;
  avatar: string | null;
  tier: Tier;
  isAdmin: boolean;
  roles: string[];
  memberStatus: string;
}

export interface AppConfig {
  setupCompleted: boolean;
  guildId: string;
  guildName?: string;
}

export interface Stats {
  totalMembers: number;
  totalSkillUps: number;
  weeklyAdded: number;
  weeklyDone: number;
  weeklyTotal: number;
  weeklyPercent: number;
  pendingApplications: number;
  pendingCerts: number;
  activeNotices: number;
}

export interface Notice {
  id: string;
  title: string;
  body: string;
  notice_date: string | null;
  active: boolean;
  sort: number;
  created_at: string;
}

/** 길드원(계산값). 별도 로스터 없이 users + 승인된 인증에서 파생. */
export interface GuildMember {
  discordId: string;
  nick: string;
  job: string | null;
  level: number | null;
  avatar: string | null;
  tier: Tier;
  roles: string[];
  joinedAt: string | null;
  skills: Record<string, number>;
  weekCount: number;
  totalSkills: number;
}

export interface FormField {
  name: string;
  label: string;
  type: "text" | "textarea" | "number" | "select" | "checkbox" | "image";
  required?: boolean;
  options?: string[];
}
export interface FormDef {
  key: string;
  title: string;
  description: string | null;
  fields: FormField[];
}

export interface ReviewSubmission {
  id: string;
  form_key: string;
  user_id: string | null;
  answers: Record<string, unknown> & { author_name?: string; image_url?: string; content?: string };
  status: SubmissionStatus;
  source: "web" | "discord";
  created_at: string;
  forms?: { title: string };
  user?: { username?: string; global_name?: string | null; avatar?: string | null } | null;
}

export interface ListResult<T> {
  items: T[];
  total: number;
}
