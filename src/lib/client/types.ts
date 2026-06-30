// 프론트엔드 공용 타입 — 백엔드 API 응답 형태에 맞춤.
export type Tier = "admin" | "reviewer" | "member" | "guest";
export type SubmissionStatus = "pending" | "approved" | "rejected";
export type Source = "web" | "discord";

export interface Me {
  discordId: string;
  name: string;
  avatar: string | null;
  tier: Tier;
  isAdmin: boolean;
  roles: string[];
  memberStatus: string;
  totalPoints: number;
}

/** GET /api/v1/submissions/mine */
export interface MineSubmission {
  id: string;
  form_key: string;
  answers: Record<string, unknown>;
  status: SubmissionStatus;
  review_note: string | null;
  created_at: string;
  reviewed_at: string | null;
  forms?: { title: string };
}

/** GET /api/v1/submissions?status=&formKey=&source= */
export interface ReviewSubmission {
  id: string;
  form_id: string;
  form_key: string;
  user_id: string;
  answers: Record<string, unknown> & {
    // discord 소스에서 채워지는 필드
    content?: string;
    image_url?: string;
    author_name?: string;
  };
  status: SubmissionStatus;
  source: Source;
  discord_message_id: string | null;
  created_at: string;
  forms?: { title: string };
  user?: { username?: string; global_name?: string | null; avatar?: string | null };
}

export interface Member {
  discord_id: string;
  username: string;
  global_name: string | null;
  avatar: string | null;
  tier: Tier;
  total_points: number;
  member_status: string;
  last_login: string | null;
}

export interface PointLog {
  id: string;
  delta: number;
  reason: string;
  created_at: string;
}

export interface MemberDetail extends Member {
  pointLogs?: PointLog[];
}

export interface Stats {
  totalMembers: number;
  approvedMembers: number;
  activeForms: number;
  pendingSubmissions: number;
  totalSubmissions: number;
  totalPointsAwarded: number;
  topPoints: { name: string; points: number }[];
  submissionStatus: { pending: number; approved: number; rejected: number };
}

/** GET /api/v1/config — 대시보드 설정 배너용 */
export interface AppConfig {
  setupCompleted: boolean;
  guildName?: string;
  notifyChannelId?: string | null;
}

/** GET /api/v1/setup/options */
export interface SetupOptions {
  setupCompleted: boolean;
  guild: { id: string; name: string };
  channels: { id: string; name: string }[];
  roles: { id: string; name: string; suggestedTier: Tier | "none" }[];
  config: { notifyChannelId: string | null };
}
