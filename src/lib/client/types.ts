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

/** members.attributes 의 메이플 도메인 형태(프론트 해석용). */
export interface MemberAttributes {
  rank?: string;
  job?: string;
  level?: number;
  boss?: number;
  ignore?: number;
  power?: number;
  joinDate?: string;
  skills?: { boss?: number; ignore?: number; attack?: number; exp?: number; accuracy?: number };
  // 디스코드 동기화 필드
  discordId?: string;
  avatar?: string | null;
  discordRoles?: string[];
}

export interface Member {
  id: string;
  nick: string;
  attributes: MemberAttributes;
  active: boolean;
  created_at: string;
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
