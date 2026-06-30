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
  channels: { id: string; name: string }[];
  roles: { id: string; name: string; suggestedTier: string }[];
  config: { notifyChannelId: string | null };
};

const TIER_OPTS = [
  { value: "none", label: "미지정" },
  { value: "member", label: "멤버" },
  { value: "reviewer", label: "운영자" },
  { value: "admin", label: "관리자" },
];

export function SetupPanel() {
  const [guildId, setGuildId] = useState("");
  const path = `/api/v1/setup/options${guildId ? `?guildId=${guildId}` : ""}`;
  const { data, loading, error } = useApi<SetupOptions>(path);
  const [notify, setNotify] = useState("");
  const [map, setMap] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!data) return;
    if (!guildId) setGuildId(data.guild.id);
    setNotify(data.config.notifyChannelId || "");
    setMap(Object.fromEntries(data.roles.map((r) => [r.id, r.suggestedTier])));
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

  async function save() {
    setBusy(true);
    try {
      await apiPut("/api/v1/setup", { guildId: data!.guild.id, notifyChannelId: notify, roleTiers: map });
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
          <p>연동할 서버를 선택하고, 알림 채널과 역할 → 등급 매핑을 설정합니다.</p>
        </div>
      </div>

      <div className="card" style={{ padding: 20, marginBottom: 14 }}>
        <div className="field" style={{ maxWidth: 420 }}>
          <label>연동 서버</label>
          <select value={data.guild.id} onChange={(e) => setGuildId(e.target.value)}>
            {data.manageableGuilds.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name} ({g.id})
              </option>
            ))}
          </select>
          {data.setupCompleted && (
            <div className="tiny">현재 저장된 서버를 다른 서버로 바꿔 저장할 수 있습니다.</div>
          )}
        </div>
      </div>

      <div className="card" style={{ padding: 20, marginBottom: 14 }}>
        <div className="field" style={{ maxWidth: 360 }}>
          <label>알림 채널</label>
          <select value={notify} onChange={(e) => setNotify(e.target.value)}>
            <option value="">사용 안 함</option>
            {data.channels.map((c) => (
              <option key={c.id} value={c.id}>
                #{c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="card" style={{ padding: 20 }}>
        <div className="form-section-title" style={{ marginBottom: 14 }}>
          역할 → 등급 매핑
        </div>
        <div style={{ display: "grid", gap: 10 }}>
          {data.roles.map((r) => (
            <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ minWidth: 140, fontWeight: 700 }}>{r.name}</span>
              <select
                value={map[r.id] ?? "none"}
                onChange={(e) => setMap({ ...map, [r.id]: e.target.value })}
                style={{ height: 40, borderRadius: 7, border: "1px solid var(--line)", padding: "0 10px" }}
              >
                {TIER_OPTS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
        <div className="modal-actions">
          <button className="btn-save" onClick={save} disabled={busy}>
            {busy ? "저장 중…" : "설정 저장"}
          </button>
        </div>
      </div>
    </div>
  );
}
