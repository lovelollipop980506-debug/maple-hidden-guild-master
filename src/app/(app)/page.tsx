"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useApi } from "@/lib/client/useApi";
import { Loading } from "@/components/Loading";
import type { Stats, Notice } from "@/lib/client/types";

function fmtNoticeDate(d: string | null) {
  if (!d) return "";
  const x = new Date(d + "T00:00:00");
  return isNaN(x.getTime()) ? d : `${String(x.getMonth() + 1).padStart(2, "0")}/${String(x.getDate()).padStart(2, "0")}`;
}

export default function HomePage() {
  const router = useRouter();
  const { data: stats, loading: statsLoading } = useApi<Stats>("/api/v1/stats");
  const { data: notices } = useApi<Notice[]>("/api/v1/notices");
  const [ni, setNi] = useState(0);

  const list = notices ?? [];
  useEffect(() => {
    if (list.length <= 1) return;
    const t = setInterval(() => setNi((i) => (i + 1) % list.length), 5000);
    return () => clearInterval(t);
  }, [list.length]);
  const cur = list[ni % (list.length || 1)];

  const s = stats;
  const pct = s?.weeklyPercent ?? 0;

  if (statsLoading && !stats) return <Loading />;

  return (
    <section className="viewPage active">
        <div className="hero">
          <div className="brand">
            <div className="name">
              <h1>히든</h1>
              <div className="en">HIDDEN GUILD</div>
              <p>게임은 콘텐츠로, 길드는 사람으로 완성됩니다.</p>
            </div>
          </div>
          <div className="hero-summary">
            <div className="stats">
              <div className="stat">
                <label>길드원</label>
                <b>{s?.totalMembers ?? 0}</b>
                <small>등록 멤버</small>
              </div>
              <div className="stat">
                <label>누적 스킬업</label>
                <b>{(s?.totalSkillUps ?? 0).toLocaleString()}</b>
                <small>이번 주 +{s?.weeklyAdded ?? 0}</small>
              </div>
            </div>
            <div className="hero-week">
              <div className="hero-week-head">
                <span>이번 주 인증 현황</span>
                <b>{pct}%</b>
              </div>
              <div className="hero-week-body">
                <div className="ring" style={{ ["--pct" as string]: pct } as React.CSSProperties}>
                  <div>
                    <b>{pct}%</b>
                    <span>인증 완료</span>
                  </div>
                </div>
                <div className="hero-week-legend">
                  <div>
                    <span>
                      <i className="dot done-dot" />
                      인증 완료
                    </span>
                    <b>{s?.weeklyDone ?? 0}명</b>
                  </div>
                  <div>
                    <span>
                      <i className="dot not-dot" />
                      미인증
                    </span>
                    <b>{(s?.weeklyTotal ?? 0) - (s?.weeklyDone ?? 0)}명</b>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="notice">
          <strong>공지</strong>
          <div className="notice-copy">
            <div className="notice-meta">
              <b>{cur ? cur.title : "등록된 공지가 없습니다."}</b>
              <span className="notice-date">{cur ? fmtNoticeDate(cur.notice_date) : ""}</span>
            </div>
            <div className="notice-body">{cur ? cur.body : "공지 관리에서 공지사항을 등록하세요."}</div>
          </div>
          <button className="more" onClick={() => router.push("/notices")}>
            전체 보기
          </button>
        </div>

        <div className="home-actions">
          <div className="home-action">
            <h3>스킬업 인증</h3>
            <p>스킬업 인증은 디스코드 인증 채널의 버튼으로 제출합니다. 운영진 승인 후 누적 스킬업과 이번 주 현황에 반영됩니다.</p>
          </div>
          <div className="home-action">
            <h3>길드원 조회</h3>
            <p>길드원 정보와 세부 능력치는 부마스터 전용입니다. 부마스터 로그인 후 조회할 수 있습니다.</p>
            <button onClick={() => router.push("/admin/directory")}>길드원 조회 →</button>
          </div>
        </div>
      </section>
  );
}
