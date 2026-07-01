"use client";
import { useEffect, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { useApi } from "@/lib/client/useApi";
import { Loading } from "@/components/Loading";
import { AsyncButton } from "@/components/AsyncButton";

type BootstrapStatus = {
  guildId: string;
  botReady: boolean;
  member: boolean;
  canInvite: boolean;
  standingUnknown: boolean;
  inviteUrl: string;
  locked: boolean;
};

/**
 * 봇이 운영 길드에 초대되기 전에는 로그인 사용자에게 "봇 초대" 화면을 먼저 띄운다.
 * - 이 사용자가 봇을 초대할 권한이 있는지(소유자/서버 관리)를 OAuth 토큰으로 판별해 화면을 나눈다.
 * - 봇 미초대 동안 상태를 폴링 → 초대되면 자동 감지하여 세션 등급을 갱신하고 앱으로 진입한다.
 * 설정 완료 후에는 botReady=true 라 평소엔 보이지 않는다.
 */
export function BootstrapGate({ children }: { children: React.ReactNode }) {
  const { data, loading, reload } = useApi<BootstrapStatus>("/api/v1/setup/status");
  const { update } = useSession();
  const [sawNotReady, setSawNotReady] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshed, setRefreshed] = useState(false);

  const notReady = !!data && !data.botReady;

  useEffect(() => {
    if (notReady) setSawNotReady(true);
  }, [notReady]);

  // 봇 미초대 동안 자동으로 초대 여부 확인(초대되면 다음 폴링에서 감지).
  useEffect(() => {
    if (!notReady) return;
    const id = setInterval(reload, 4000);
    return () => clearInterval(id);
  }, [notReady, reload]);

  // 방금 초대 감지됨(미초대→초대 전환) → 세션 등급 갱신 후 앱으로 진입.
  useEffect(() => {
    if (data?.botReady && sawNotReady && !refreshed && !refreshing) {
      setRefreshing(true);
      (async () => {
        try {
          await update();
        } catch {
          /* 무시 — 다음 렌더에서 children 진입 */
        }
        setRefreshed(true);
      })();
    }
  }, [data?.botReady, sawNotReady, refreshed, refreshing, update]);

  // 초기 로딩 or 세션 갱신 중 → 하나의 스피너로 매끄럽게.
  if ((loading && !data) || (refreshing && !refreshed)) return <Loading />;

  if (data && !data.botReady) {
    const canInvite = data.canInvite || data.standingUnknown; // 판별 불가면 시도는 허용(Discord가 최종 차단)
    return (
      <div className="boot-wrap">
        <div className="card boot-card">
          <div className="boot-icon">{canInvite ? "🤖" : "🔒"}</div>

          {canInvite ? (
            <>
              <h2 className="boot-title">봇을 초대해 주세요</h2>
              <p className="boot-desc">
                설정을 시작하려면 디스코드 서버에 봇을 초대해야 합니다.
                <br />
                초대하면 <b>자동으로 감지</b>되어 다음 단계로 넘어가요.
              </p>
              <div className="boot-status wait">
                <span className="dot" />
                초대 대기 중 · 자동 확인
              </div>
              <div className="boot-actions">
                <a className="discord-btn" href={data.inviteUrl} target="_blank" rel="noreferrer">
                  봇 초대하기
                </a>
              </div>
              {data.standingUnknown && (
                <p className="boot-desc" style={{ fontSize: 12, marginTop: 12 }}>
                  ※ 권한을 확인하지 못했어요. 서버 관리 권한이 있어야 초대가 완료됩니다.
                </p>
              )}
            </>
          ) : (
            <>
              <h2 className="boot-title">관리자 설정이 필요해요</h2>
              <p className="boot-desc">
                이 시스템은 아직 초기 설정 전이에요. 봇 초대와 설정은{" "}
                <b>서버 소유자 또는 서버 관리 권한자</b>만 할 수 있어요.
                <br />
                서버 관리자에게 설정을 요청해 주세요.
              </p>
              <div className="boot-status none">
                <span className="dot" />
                {data.member ? "초대 권한 없음" : "서버 멤버 아님"} · 관리자 설정 대기
              </div>
            </>
          )}

          <AsyncButton className="boot-logout" onClick={() => signOut({ callbackUrl: "/login" })}>
            로그아웃
          </AsyncButton>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
