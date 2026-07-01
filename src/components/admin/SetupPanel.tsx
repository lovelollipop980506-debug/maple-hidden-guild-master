"use client";
import { useEffect, useState } from "react";
import { useApi } from "@/lib/client/useApi";
import { apiPut, apiPost, ApiError } from "@/lib/client/api";
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
  config: { notifyChannelId: string | null; certChannelId: string | null; certMessage: string | null };
};

export function SetupPanel() {
  const [guildId, setGuildId] = useState("");
  const path = `/api/v1/setup/options${guildId ? `?guildId=${guildId}` : ""}`;
  const { data, loading, error } = useApi<SetupOptions>(path);
  // 운영진으로 지정된 역할 id 집합. 나머지는 자동: 소유자/관리자=관리자, 역할 보유=멤버.
  const [reviewers, setReviewers] = useState<Set<string>>(new Set());
  const [notifyCh, setNotifyCh] = useState("");
  const [certCh, setCertCh] = useState("");
  const [certMsg, setCertMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    if (!data) return;
    if (!guildId) setGuildId(data.guild.id);
    setReviewers(new Set(data.roles.filter((r) => r.suggestedTier === "reviewer").map((r) => r.id)));
    setNotifyCh(data.config.notifyChannelId ?? "");
    setCertCh(data.config.certChannelId ?? "");
    setCertMsg(data.config.certMessage ?? "");
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
      await apiPut("/api/v1/setup", {
        guildId: data!.guild.id,
        notifyChannelId: notifyCh,
        certChannelId: certCh,
        certMessage: certMsg,
        roleTiers,
      });
      toast("설정을 저장했습니다. 다시 로그인하면 적용됩니다.");
    } catch (e) {
      toast((e as ApiError).message);
    } finally {
      setBusy(false);
    }
  }

  async function postCertButton() {
    if (!certCh) return toast("인증 채널을 먼저 선택하세요.");
    setPosting(true);
    try {
      await apiPost("/api/v1/setup/cert-panel", { channelId: certCh });
      toast("인증 채널에 스킬업 인증 버튼을 올렸습니다.");
    } catch (e) {
      toast((e as ApiError).message);
    } finally {
      setPosting(false);
    }
  }

  // 봇 상태 뱃지 / 액션 링크 공통 pill — 높이·패딩 일관.
  const pill = {
    display: "inline-flex",
    alignItems: "center",
    height: 42,
    padding: "0 16px",
    borderRadius: 7,
    fontWeight: 700,
    fontSize: 14,
    whiteSpace: "nowrap",
    textDecoration: "none",
  } as const;

  return (
    <div className="panel active">
      <div className="panel-head">
        <div>
          <h2>설정</h2>
          <p>봇을 연동 서버에 초대하고, 어떤 디스코드 역할이 부마스터인지 지정합니다.</p>
        </div>
      </div>

      <div className="card" style={{ padding: 20, marginBottom: 14 }}>
        <div className="form-section-title">연동 서버</div>
        <div className="field">
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <select value={data.guild.id} onChange={(e) => setGuildId(e.target.value)} style={{ flex: 1, minWidth: 240 }}>
              {data.manageableGuilds.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} ({g.id})
                </option>
              ))}
            </select>
            <span style={{ ...pill, ...(data.botPresent ? { background: "#dff5e8", color: "#13a658" } : { background: "#ffe7e9", color: "#f2394a" }) }}>
              {data.botPresent ? "봇 초대됨" : "봇 초대 필요"}
            </span>
            <a style={{ ...pill, background: "#eaf3ff", color: "#2174d8" }} href={data.inviteUrl} target="_blank" rel="noreferrer">
              {data.botPresent ? "권한 갱신" : "봇 초대"}
            </a>
          </div>
          {data.setupCompleted && (
            <div className="tiny" style={{ marginTop: 8 }}>현재 저장된 서버를 다른 서버로 바꿔 저장할 수 있습니다.</div>
          )}
        </div>
      </div>

      <div className="card" style={{ padding: 20, marginBottom: 14 }}>
        <div className="form-section-title">채널</div>
        <div style={{ display: "grid", gap: 16, marginTop: 4 }}>
          <div>
            <label className="tiny" style={{ display: "block", marginBottom: 6, fontWeight: 800 }}>알림 채널</label>
            <select value={notifyCh} onChange={(e) => setNotifyCh(e.target.value)} style={{ width: "100%", height: 42 }}>
              <option value="">선택 안 함</option>
              {data.channels.map((c) => (
                <option key={c.id} value={c.id}>
                  # {c.name}
                </option>
              ))}
            </select>
            <p className="tiny" style={{ marginTop: 6 }}>가입·인증 승인/반려 알림이 이 채널로 전송됩니다.</p>
          </div>
          <div>
            <label className="tiny" style={{ display: "block", marginBottom: 6, fontWeight: 800 }}>길드 스킬업 인증 채널</label>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <select value={certCh} onChange={(e) => setCertCh(e.target.value)} style={{ flex: 1, minWidth: 220, height: 42 }}>
                <option value="">선택 안 함</option>
                {data.channels.map((c) => (
                  <option key={c.id} value={c.id}>
                    # {c.name}
                  </option>
                ))}
              </select>
              <button className="more" style={{ flexShrink: 0, height: 42, whiteSpace: "nowrap" }} onClick={postCertButton} disabled={posting || !certCh}>
                {posting ? <span className="btn-spinner" /> : "인증 버튼 올리기"}
              </button>
            </div>
            <label className="tiny" style={{ display: "block", margin: "12px 0 6px", fontWeight: 800 }}>인증 안내 문구</label>
            <textarea
              className="textarea"
              style={{ height: 80 }}
              placeholder="예: 아래 버튼을 눌러 스킬업을 인증하세요."
              value={certMsg}
              onChange={(e) => setCertMsg(e.target.value)}
            />
            <p className="tiny" style={{ marginTop: 6 }}>
              선택한 채널에 “스킬업 인증하기” 버튼을 위 문구와 함께 올립니다. 멤버가 눌러 인증을 제출해요. (변경 시 먼저 설정 저장 → 인증 버튼 올리기)
            </p>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 20 }}>
        <div className="form-section-title" style={{ marginBottom: 6 }}>
          부마스터 역할
        </div>
        <p className="tiny" style={{ marginBottom: 14 }}>
          체크한 역할 = 부마스터(가입·인증 승인, 길드원 조회). 체크 안 한 역할은 일반 멤버. 서버 소유자는 자동으로 길드 마스터입니다.
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
            {busy ? <span className="btn-spinner" /> : "설정 저장"}
          </button>
        </div>
      </div>
    </div>
  );
}
