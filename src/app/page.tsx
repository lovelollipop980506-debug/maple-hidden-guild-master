"use client";
import Link from "next/link";
import { AppShell, PageHead, useCurrentMe } from "@/components/ui/AppShell";
import { LoadingState, ErrorState } from "@/components/ui/DataStates";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Avatar, Badge, Button, Panel, PointTag, Icon, EmptyState, ListRow, type IconName } from "@/components/ds";
import { useApi } from "@/lib/client/useApi";
import { apiGet } from "@/lib/client/api";
import { TIER_LABEL } from "@/lib/client/tier";
import { formKeyLabel, relativeTime } from "@/lib/client/format";
import type { MineSubmission } from "@/lib/client/types";
import * as React from "react";

function FeatureCard({ href, icon, title, desc }: { href: string; icon: IconName; title: string; desc: string }) {
  const [hover, setHover] = React.useState(false);
  return (
    <Link
      href={href}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "block",
        textDecoration: "none",
        background: hover ? "var(--surface-panel-hover)" : "var(--surface-panel)",
        borderRadius: "var(--radius-panel)",
        boxShadow: "var(--gloss-soft), var(--shadow-md)",
        padding: 22,
        transform: hover ? "translateY(-2px)" : "none",
        transition: "all var(--dur-med) var(--ease-out)",
      }}
    >
      <span
        style={{
          display: "inline-flex",
          width: 46,
          height: 46,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "var(--radius-chip)",
          background: "var(--teal-500)",
          boxShadow: "var(--gloss-strong)",
        }}
      >
        <Icon name={icon} size={24} color="#fff" />
      </span>
      <div style={{ marginTop: 16, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "var(--text-lg)", color: "var(--white)" }}>
        {title}
      </div>
      <div style={{ marginTop: 6, color: "var(--text-muted)", fontSize: "var(--text-sm)", lineHeight: 1.5 }}>{desc}</div>
    </Link>
  );
}

function DashboardInner() {
  const { me, loading: meLoading, error: meError, reload: reloadMe } = useCurrentMe();
  const { data, loading, error, reload } = useApi<MineSubmission[]>(
    () => apiGet<MineSubmission[]>("/api/v1/submissions/mine"),
    [],
  );
  const recent = (data || []).slice(0, 5);

  if (meLoading) {
    return (
      <Panel>
        <LoadingState rows={2} />
      </Panel>
    );
  }
  if (meError || !me) return <ErrorState error={meError} onRetry={reloadMe} />;

  return (
    <div>
      <Panel style={{ marginBottom: 22, overflow: "hidden" }} bodyStyle={{ padding: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 22,
            padding: "26px 28px",
            flexWrap: "wrap",
            background: "linear-gradient(100deg, rgba(17,119,153,0.35), rgba(51,57,57,0) 70%)",
          }}
        >
          <Avatar name={me.name} src={me.avatar} tier={me.tier} size={64} online />
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 26, color: "var(--text-label)" }}>
                어서오세요, {me.name} 님!
              </span>
              <Badge tone={me.tier} solid>
                {TIER_LABEL[me.tier]}
              </Badge>
            </div>
            <p style={{ marginTop: 8, color: "var(--gray-300)", fontSize: "var(--text-base)" }}>
              멤버 상태: {me.memberStatus} · 오늘도 히든 길드와 함께해요.
            </p>
          </div>
          <PointTag value={me.totalPoints} size="lg" />
        </div>
      </Panel>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px,1fr))", gap: 16, marginBottom: 22 }}>
        <FeatureCard href="/join" icon="scroll" title="가입 신청서" desc="길드 가입을 신청하고 진행 상황을 확인합니다." />
        <FeatureCard href="/skills" icon="star" title="스킬 포인트 인증" desc="활동을 인증하고 포인트를 적립받습니다." />
        <FeatureCard href="/me/submissions" icon="home" title="내 제출내역" desc="제출한 신청·인증의 상태를 확인합니다." />
      </div>

      <Panel
        title="최근 내 제출"
      >
        {loading ? (
          <LoadingState rows={3} />
        ) : error ? (
          <ErrorState error={error} onRetry={reload} />
        ) : recent.length === 0 ? (
          <EmptyState
            title="아직 제출 내역이 없습니다"
            hint="가입 신청이나 스킬 인증을 제출해 보세요."
            action={
              <Link href="/join" style={{ textDecoration: "none" }}>
                <Button>가입 신청하기</Button>
              </Link>
            }
          />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {recent.map((s) => (
              <ListRow
                key={s.id}
                title={formKeyLabel(s.form_key, s.forms?.title)}
                subtitle={relativeTime(s.created_at)}
                trailing={<StatusBadge status={s.status} />}
              />
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <AppShell>
      <PageHead title="대시보드" />
      <DashboardInner />
    </AppShell>
  );
}
