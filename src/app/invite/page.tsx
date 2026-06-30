"use client";
import { useRouter } from "next/navigation";
import { Shell } from "@/components/Shell";
import { useApi } from "@/lib/client/useApi";

type InviteInfo = {
  clientId: string;
  genericInviteUrl: string;
  needsRelogin: boolean;
  targets: { id: string; name: string; botPresent: boolean; inviteUrl: string }[];
};

export default function InvitePage() {
  const router = useRouter();
  const { data, loading } = useApi<InviteInfo>("/api/v1/discord/invite");

  return (
    <Shell>
      <section className="viewPage active">
        <div className="page-head">
          <div>
            <h2>봇 초대</h2>
            <p>봇을 서버에 초대합니다. "서버 관리" 권한이 있는 서버에만 초대할 수 있습니다.</p>
          </div>
          <a className="more" href={data?.genericInviteUrl} target="_blank" rel="noreferrer">
            서버 직접 선택해 초대 →
          </a>
        </div>

        <div className="card" style={{ padding: 22 }}>
          {loading ? (
            <div className="empty">불러오는 중…</div>
          ) : data?.needsRelogin ? (
            <div className="empty">
              초대 가능한 서버를 보려면 다시 로그인이 필요합니다.{" "}
              <button className="more" onClick={() => router.push("/login")} style={{ marginLeft: 8 }}>
                로그인
              </button>
            </div>
          ) : !data?.targets.length ? (
            <div className="empty">
              관리 권한이 있는 서버가 없습니다. 위의 "서버 직접 선택해 초대"로 진행하세요.
            </div>
          ) : (
            <table className="table" style={{ minWidth: 0 }}>
              <thead>
                <tr>
                  <th>서버</th>
                  <th>봇 상태</th>
                  <th>관리</th>
                </tr>
              </thead>
              <tbody>
                {data.targets.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <b>{t.name}</b>
                      <div style={{ fontSize: 12, color: "var(--muted)" }}>{t.id}</div>
                    </td>
                    <td>
                      {t.botPresent ? (
                        <span className="badge ok">초대됨</span>
                      ) : (
                        <span className="badge no">미초대</span>
                      )}
                    </td>
                    <td>
                      {t.botPresent ? (
                        <button className="small-btn edit" onClick={() => router.push("/admin/setup")}>
                          설정하기
                        </button>
                      ) : (
                        <a className="small-btn approve" href={t.inviteUrl} target="_blank" rel="noreferrer">
                          봇 초대하기
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </Shell>
  );
}
