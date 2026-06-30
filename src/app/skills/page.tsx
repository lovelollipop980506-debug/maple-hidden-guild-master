"use client";
import * as React from "react";
import { AppShell, PageHead, TierGuard, useCurrentMe } from "@/components/ui/AppShell";
import { useToast } from "@/components/ui/Toast";
import { FileInput } from "@/components/ui/FileInput";
import { Button, Panel, Field, Textarea, PointTag, EmptyState, Icon } from "@/components/ds";
import { apiPostForm, ApiError } from "@/lib/client/api";

const MAX_BYTES = 5 * 1024 * 1024; // 5MB

function SkillsInner() {
  const toast = useToast();
  const { me } = useCurrentMe();
  const [skill, setSkill] = React.useState("");
  const [points, setPoints] = React.useState("");
  const [note, setNote] = React.useState("");
  const [evidence, setEvidence] = React.useState<File | null>(null);
  const [errors, setErrors] = React.useState<{ skill?: string; points?: string; evidence?: string }>({});
  const [submitting, setSubmitting] = React.useState(false);
  const [done, setDone] = React.useState(false);

  function validate(): boolean {
    const next: typeof errors = {};
    if (!skill.trim()) next.skill = "스킬/항목을 입력해 주세요.";
    if (!points.trim()) next.points = "포인트를 입력해 주세요.";
    else if (Number.isNaN(Number(points)) || Number(points) < 0) next.points = "0 이상의 숫자를 입력해 주세요.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function submit() {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("skill", skill.trim());
      fd.append("points", String(Number(points)));
      fd.append("note", note.trim());
      if (evidence) fd.append("evidence", evidence);
      await apiPostForm("/api/v1/forms/skill_points/submissions", fd);
      toast.success("인증이 제출되었습니다. 승인 후 포인트가 적립됩니다.");
      setDone(true);
    } catch (e) {
      const err = e as ApiError;
      toast.error(err.message || "제출에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <PageHead
        title="스킬 포인트 인증"
        sub="활동 기록을 제출하면 운영자 승인 후 포인트가 적립됩니다."
        right={
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ color: "var(--text-muted)", fontSize: "var(--text-sm)" }}>내 포인트</span>
            <PointTag value={me?.totalPoints ?? 0} size="lg" />
          </div>
        }
      />

      {done ? (
        <Panel>
          <EmptyState
            glyph="⭐"
            title="인증이 제출되었습니다"
            hint="운영자 검토 후 포인트가 적립됩니다. 결과는 내 제출내역에서 확인할 수 있어요."
            action={
              <div style={{ display: "flex", gap: 10 }}>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setSkill("");
                    setPoints("");
                    setNote("");
                    setEvidence(null);
                    setErrors({});
                    setDone(false);
                  }}
                >
                  새 인증 제출
                </Button>
                <Button onClick={() => (window.location.href = "/me/submissions")}>내 제출내역</Button>
              </div>
            }
          />
        </Panel>
      ) : (
        <Panel title="인증 제출" style={{ maxWidth: 620 }}>
          <Field label="스킬 / 항목 *" placeholder="예: 자쿰 클리어" value={skill} onChange={(e) => setSkill(e.target.value)} error={errors.skill} />
          <div style={{ marginTop: 16 }}>
            <Field
              label="요청 포인트 *"
              type="number"
              min={0}
              placeholder="예: 50"
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              error={errors.points}
              hint="운영자가 가감하여 최종 확정합니다."
            />
          </div>
          <div style={{ marginTop: 16 }}>
            <Textarea label="설명" rows={3} placeholder="활동 내용을 간단히 적어주세요" value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          <div style={{ marginTop: 16 }}>
            <FileInput
              label="증빙 이미지 (선택 · 5MB 이하)"
              accept="image/*"
              maxBytes={MAX_BYTES}
              onFile={(f) => { setEvidence(f); setErrors((x) => ({ ...x, evidence: undefined })); }}
              onError={(m) => { setErrors((x) => ({ ...x, evidence: m })); toast.error(m); }}
              error={errors.evidence}
            />
          </div>
          <div style={{ marginTop: 18, textAlign: "right" }}>
            <Button onClick={submit} disabled={submitting} icon={<Icon name="check" size={16} color="#fff" />}>
              {submitting ? "제출 중…" : "인증 제출"}
            </Button>
          </div>
        </Panel>
      )}
    </div>
  );
}

export default function SkillsPage() {
  return (
    <AppShell>
      <GateWrap />
    </AppShell>
  );
}

function GateWrap() {
  const { me } = useCurrentMe();
  return (
    <TierGuard required="member" tier={me?.tier}>
      <SkillsInner />
    </TierGuard>
  );
}
