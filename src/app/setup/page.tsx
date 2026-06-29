import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getConfig } from "@/lib/config";
import {
  getBotGuilds,
  getManageableGuilds,
  canManageGuild,
  listGuildChannels,
  listGuildRoles,
  type PartialGuild,
} from "@/lib/discord";
import { suggestTier } from "@/lib/permissions";
import SetupForm from "./SetupForm";

export default async function SetupPage() {
  const session = await getSession();
  if (!session?.user?.discordId) redirect("/login");
  const me = session.user.discordId;
  const config = await getConfig();

  // Resolve the target guild + authorize.
  let guild: PartialGuild | null = null;

  if (config.setupCompleted) {
    // Edit mode — guild owner or Manage Server permission holders.
    if (!(await canManageGuild(config.guildId, me))) redirect("/");
    const botGuilds = await getBotGuilds();
    guild =
      botGuilds.find((g) => g.id === config.guildId) ?? { id: config.guildId, name: config.guildId };
  } else {
    // First-run — guild owner or Manage Server permission holders.
    const manageable = await getManageableGuilds(me);
    if (!manageable.length) {
      return (
        <div className="mx-auto max-w-lg">
          <div className="card space-y-2">
            <h1 className="text-xl font-bold text-white">초기 설정</h1>
            <p className="text-sm text-zinc-300">
              초기 설정은 디스코드 서버 <strong>소유자</strong> 또는 <strong>서버 관리(Manage Server) 권한자</strong>만
              진행할 수 있습니다.
            </p>
            <p className="text-sm text-zinc-500">
              봇이 해당 서버에 초대되어 있고, 당신이 그 서버의 소유자이거나 관리 권한이 있는지 확인하세요.
              (봇 토큰이 올바른지도 확인이 필요합니다.)
            </p>
          </div>
        </div>
      );
    }
    guild = manageable[0];
  }

  const [channels, roles] = await Promise.all([
    listGuildChannels(guild.id),
    listGuildRoles(guild.id),
  ]);

  const rolesWithDefault = roles.map((r) => {
    // Prefer an existing saved mapping, else the permission-based suggestion.
    let defaultTier: "admin" | "reviewer" | "member" | "none" = "none";
    if (config.adminRoleIds.includes(r.id)) defaultTier = "admin";
    else if (config.reviewerRoleIds.includes(r.id)) defaultTier = "reviewer";
    else if (config.memberRoleIds.includes(r.id)) defaultTier = "member";
    else {
      const s = suggestTier(r.permissions);
      defaultTier = s === "none" ? "none" : s;
    }
    return { id: r.id, name: r.name, defaultTier };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">
          {config.setupCompleted ? "디스코드 연동 설정" : "초기 설정 (부트스트랩)"}
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          서버: <span className="text-zinc-200">{guild.name}</span>{" "}
          <span className="text-zinc-600">({guild.id})</span>
        </p>
      </div>

      <SetupForm
        guild={guild}
        channels={channels}
        roles={rolesWithDefault}
        sourceChannelIds={config.sourceChannelIds}
        notifyChannelId={config.notifyChannelId}
        approvedMemberRoleId={config.approvedMemberRoleId}
        reconfigure={config.setupCompleted}
      />
    </div>
  );
}
