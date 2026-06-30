"use client";
import { useEffect, useState } from "react";
import { useApi } from "@/lib/client/useApi";
import { apiPut, ApiError } from "@/lib/client/api";
import { toast } from "@/lib/client/toast";
import { Loading } from "@/components/Loading";

type SetupOptions = {
  setupCompleted: boolean;
  manageableGuilds: { id: string; name: string }[];
  guild: { id: string; name: string };
  botPresent: boolean;
  inviteUrl: string;
  channels: { id: string; name: string }[];
  roles: { id: string; name: string; suggestedTier: string }[];
  config: { notifyChannelId: string | null };
};

export function SetupPanel() {
  const [guildId, setGuildId] = useState("");
  const path = `/api/v1/setup/options${guildId ? `?guildId=${guildId}` : ""}`;
  const { data, loading, error } = useApi<SetupOptions>(path);
  // 운영진으로 지정된 역할 id 집합. 나머지는 자동: 소유자/관리자=관리자, 역할 보유=멤버.
  const [reviewers, setReviewers] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!data) return;
    if (!guildId) setGuildId(data.guild.id);
    setReviewers(new Set(data.roles.filter((r) => r.suggestedTier === "reviewer").map((r) => r.id)));
  }, [data, guildId]);

  if (loading && !data) return <Loading />;
  if (error || !data) {
    return (
      <div className="panel active">
        <div className="card" style={{ padding: 30, textAlign: "center" }}>
          <h2>설정 권한이 없습니다</h2>
          <p style={{ color: "var(--muted)", marginTop: 8 }}>
            {(error as ApiError)?.message || "서버 소유자 또는 서버 관리 권한자만 설정할 수 있습니다."}
          </p>
        </div>
      </div>
    );
  }

  function toggle(roleId: string) {
    setReviewers((prev) => {
      const next = new Set(prev);
      if (next.has(roleId)) next.delete(roleId);
      else next.add(roleId);
      return next;
    });
  }

  async function save() {
    setBusy(true);
    try {
      const roleTiers = Object.fromEntries(data!.roles.map((r) => [r.id, reviewers.has(r.id) ? "reviewer" : "none"]));
      await apiPut("/api/v1/setup", { guildId: data!.guild.id, roleTiers });
      toast("설정을 저장했습니다. 다시 로그인하면 적용됩니다.");
    } catch (e) {
      toast((e as ApiError).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="panel active">
      <div className="panel-head">
        <div>
          <h2>설정</h2>
          <p>봇을 연동 서버에 초대하고, 어떤 디스코드 역할이 운영진인지 지정합니다.</p>
        </div>
      </div>

      <div className="card" style={{ padding: 20, marginBottom: 14 }}>
        <div className="field" style={{ maxWidth: 520 }}>
          <label>연동 서버</label>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <select value={data.guild.id} onChange={(e) => setGuildId(e.target.value)} style={{ flex: 1, minWidth: 220 }}>
              {data.manageableGuilds.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} ({g.id})
                </option>
              ))}
            </select>
            {data.botPresent ? (
              <span className="badge ok">봇 초대됨</span>
            ) : (
              <span className="badge no">봇 초대 필요</span>
            )}
            <a className="small-btn edit" href={data.inviteUrl} target="_blank" rel="noreferrer">
              {data.botPresent ? "권한 갱신" : "봇 초대"}
            </a>
          </div>
          {data.setupCompleted && (
            <div className="tiny">현재 저장된 서버를 다른 서버로 바꿔 저장할 수 있습니다.</div>
          )}
        </div>
      </div>

      <div className="card" style={{ padding: 20 }}>
        <div className="form-section-title" style={{ marginBottom: 6 }}>
          운영진 역할
        </div>
        <p className="tiny" style={{ marginBottom: 14 }}>
          체크한 역할 = 운영진(가입·인증 승인, 길드원 조회). 체크 안 한 역할은 일반 멤버. 서버 소유자는 자동으로 관리자입니다.
        </p>
        {data.roles.length === 0 ? (
          <div className="empty" style={{ height: "auto", padding: "18px 0" }}>
            디스코드에 지정할 수 있는 역할이 없습니다. 디스코드에서 역할을 먼저 만들어 주세요.
          </div>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            {data.roles.map((r) => (
              <label
                key={r.id}
                style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontWeight: 700 }}
              >
                <input type="checkbox" checked={reviewers.has(r.id)} onChange={() => toggle(r.id)} />
                {r.name}
              </label>
            ))}
          </div>
        )}
        <div className="modal-actions">
          <button className="btn-save" onClick={save} disabled={busy}>
            {busy ? "저장 중…" : "설정 저장"}
          </button>
        </div>
      </div>
    </div>
  );
}
