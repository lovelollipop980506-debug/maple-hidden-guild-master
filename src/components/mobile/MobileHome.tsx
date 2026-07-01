"use client";
import { useRouter } from "next/navigation";
import { useApi } from "@/lib/client/useApi";
import type { Stats, Notice } from "@/lib/client/types";

/** 모바일 전용 홈 — 카드 중심 레이아웃(데스크톱 hero와 완전 분리). */
export function MobileHome() {
  const router = useRouter();
  const { data: stats } = useApi<Stats>("/api/v1/stats");
  const { data: notices } = useApi<Notice[]>("/api/v1/notices");
  const s = stats;
  const pct = s?.weeklyPercent ?? 0;
  const notice = (notices ?? [])[0];

  return (
    <div className="m-home">
      <div className="m-hero">
        <h1>히든</h1>
        <p>이번 주도 인증 잊지 마세요!</p>
      </div>

      <div className="card m-week">
        <div className="ring" style={{ ["--pct" as string]: pct } as React.CSSProperties}>
          <div>
            <b>{pct}%</b>
            <span>인증 완료</span>
          </div>
        </div>
        <div className="m-week-info">
          <div>
            <span>
              <i className="dot done-dot" /> 인증 완료
            </span>
            <b>{s?.weeklyDone ?? 0}명</b>
          </div>
          <div>
            <span>
              <i className="dot not-dot" /> 미인증
            </span>
            <b>{(s?.weeklyTotal ?? 0) - (s?.weeklyDone ?? 0)}명</b>
          </div>
        </div>
      </div>

      <div className="m-stats">
        <div className="card m-stat">
          <label>길드원</label>
          <b>{s?.totalMembers ?? 0}</b>
        </div>
        <div className="card m-stat">
          <label>누적 스킬업</label>
          <b>{(s?.totalSkillUps ?? 0).toLocaleString()}</b>
          <small>이번 주 +{s?.weeklyAdded ?? 0}</small>
        </div>
      </div>

      <div className="card m-notice" onClick={() => router.push("/notices")}>
        <div className="m-notice-head">
          <strong>공지</strong>
          <span>전체 보기 →</span>
        </div>
        <b>{notice ? notice.title : "등록된 공지가 없습니다."}</b>
        <p>{notice ? notice.body : "운영진이 등록한 공지가 여기 표시됩니다."}</p>
      </div>

      <div className="card m-info">
        <h3>스킬업 인증</h3>
        <p>디스코드 인증 채널의 버튼으로 제출하세요. 운영진 승인 후 누적·이번 주 현황에 반영됩니다.</p>
      </div>
    </div>
  );
}
