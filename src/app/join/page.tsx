"use client";
import * as React from "react";
import { AppShell, PageHead } from "@/components/ui/AppShell";
import { useToast } from "@/components/ui/Toast";
import { Button, Panel, Field, Textarea, EmptyState, Icon } from "@/components/ds";
import { apiPostForm } from "@/lib/client/api";
import { ApiError } from "@/lib/client/api";

interface JoinForm {
  character_name: string;
  playtime: string;
  referral: string;
  introduction: string;
}
const EMPTY: JoinForm = { character_name: "", playtime: "", referral: "", introduction: "" };

function JoinInner() {
  const toast = useToast();
  const [form, setForm] = React.useState<JoinForm>(EMPTY);
  const [errors, setErrors] = React.useState<Partial<Record<keyof JoinForm, string>>>({});
  const [submitting, setSubmitting] = React.useState(false);
  const [done, setDone] = React.useState(false);

  const set = (k: keyof JoinForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  function validate(): boolean {
    const next: Partial<Record<keyof JoinForm, string>> = {};
    if (!form.character_name.trim()) next.character_name = "캐릭터명을 입력해 주세요.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function submit() {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("character_name", form.character_name.trim());
      fd.append("playtime", form.playtime.trim());
      fd.append("referral", form.referral.trim());
      fd.append("introduction", form.introduction.trim());
      await apiPostForm("/api/v1/forms/join/submissions", fd);
      toast.success("가입 신청이 접수되었습니다. 운영자 검토를 기다려 주세요.");
      setDone(true);
    } catch (e) {
      const err = e as ApiError;
      if (err.status === 409) {
        toast.info("이미 검토 대기 중인 신청이 있습니다.");
        setDone(true);
      } else {
        toast.error(err.message || "제출에 실패했습니다.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <Panel>
        <EmptyState
          glyph="🙌"
          title="신청이 접수되었습니다"
          hint="운영자가 검토 후 승인/반려합니다. 결과는 내 제출내역에서 확인할 수 있어요."
          action={
            <div style={{ display: "flex", gap: 10 }}>
              <Button variant="secondary" onClick={() => { setForm(EMPTY); setDone(false); }}>
                새 신청 작성
              </Button>
              <Button onClick={() => (window.location.href = "/me/submissions")}>내 제출내역</Button>
            </div>
          }
        />
      </Panel>
    );
  }

  return (
    <Panel title="새 신청서 작성">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Field
          label="캐릭터명 *"
          placeholder="예: 신입길드원"
          value={form.character_name}
          onChange={set("character_name")}
          error={errors.character_name}
        />
        <Field label="플레이 시간대" placeholder="예: 평일 저녁 / 주말 종일" value={form.playtime} onChange={set("playtime")} />
        <div style={{ gridColumn: "1 / -1" }}>
          <Field label="가입 경로" placeholder="예: 지인 추천 / 커뮤니티" value={form.referral} onChange={set("referral")} />
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <Textarea
            label="자기소개"
            rows={4}
            placeholder="자기소개와 지원 동기를 적어주세요"
            value={form.introduction}
            onChange={set("introduction")}
          />
        </div>
      </div>
      <div style={{ marginTop: 18, display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <Button variant="quiet" onClick={() => { setForm(EMPTY); setErrors({}); }} disabled={submitting}>
          초기화
        </Button>
        <Button onClick={submit} disabled={submitting} icon={<Icon name="check" size={16} color="#fff" />}>
          {submitting ? "제출 중…" : "신청서 제출"}
        </Button>
      </div>
    </Panel>
  );
}

export default function JoinPage() {
  return (
    <AppShell>
      <PageHead title="가입 신청서" sub="히든 길드에 가입을 신청합니다. 운영자가 검토 후 승인/반려합니다." />
      <JoinInner />
    </AppShell>
  );
}
