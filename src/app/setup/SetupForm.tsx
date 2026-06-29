"use client";

import { useState, useTransition } from "react";
import { signOut } from "next-auth/react";
import { saveSetup } from "./actions";

type Channel = { id: string; name: string };
type Role = { id: string; name: string; defaultTier: "admin" | "reviewer" | "member" | "none" };

export default function SetupForm({
  guild,
  channels,
  roles,
  sourceChannelIds,
  notifyChannelId,
  approvedMemberRoleId,
  reconfigure,
}: {
  guild: { id: string; name: string };
  channels: Channel[];
  roles: Role[];
  sourceChannelIds: string[];
  notifyChannelId: string;
  approvedMemberRoleId: string;
  reconfigure: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function onSubmit(formData: FormData) {
    setErr(null);
    startTransition(async () => {
      const res = await saveSetup(formData);
      if (res.ok) setDone(true);
      else setErr(res.error ?? "오류가 발생했습니다.");
    });
  }

  if (done) {
    return (
      <div className="card space-y-4">
        <h2 className="text-lg font-semibold text-emerald-400">✅ 설정이 저장되었습니다</h2>
        <p className="text-sm text-zinc-300">
          권한은 로그인 시점에 반영됩니다. <strong>다시 로그인</strong>하면 변경된 등급(소유자=관리자 등)이 적용됩니다.
        </p>
        <button className="btn-primary" onClick={() => signOut({ callbackUrl: "/login" })}>
          다시 로그인하기
        </button>
      </div>
    );
  }

  return (
    <form action={onSubmit} className="space-y-6">
      <input type="hidden" name="guildId" value={guild.id} />

      {/* 채널 수집 대상 */}
      <section className="card space-y-3">
        <h2 className="font-semibold text-white">채팅 수집 채널</h2>
        <p className="text-sm text-zinc-400">사이트로 채팅을 가져올 채널을 선택하세요 (복수 선택 가능).</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {channels.map((c) => (
            <label key={c.id} className="flex items-center gap-2 text-sm text-zinc-200">
              <input
                type="checkbox"
                name="source"
                value={c.id}
                defaultChecked={sourceChannelIds.includes(c.id)}
              />
              #{c.name}
            </label>
          ))}
          {!channels.length && <p className="text-sm text-zinc-500">조회된 채널이 없습니다.</p>}
        </div>
      </section>

      {/* 알림 채널 */}
      <section className="card space-y-3">
        <h2 className="font-semibold text-white">알림 채널 (DM 실패 시 폴백)</h2>
        <select name="notify" className="input" defaultValue={notifyChannelId}>
          <option value="">사용 안 함 (DM만)</option>
          {channels.map((c) => (
            <option key={c.id} value={c.id}>
              #{c.name}
            </option>
          ))}
        </select>
      </section>

      {/* 역할 → 등급 매핑 */}
      <section className="card space-y-3">
        <h2 className="font-semibold text-white">역할 → 등급 매핑</h2>
        <p className="text-sm text-zinc-400">
          디스코드 권한을 분석해 추천값을 미리 골라뒀습니다. 확인 후 조정하세요.
          <br />
          <span className="text-zinc-500">※ 서버 소유자는 매핑과 무관하게 항상 관리자입니다.</span>
        </p>
        <div className="space-y-2">
          {roles.map((r) => (
            <div key={r.id} className="flex items-center justify-between gap-3">
              <span className="text-sm text-zinc-200">{r.name}</span>
              <select name={`role:${r.id}`} className="input max-w-[160px]" defaultValue={r.defaultTier}>
                <option value="none">미지정</option>
                <option value="member">멤버</option>
                <option value="reviewer">운영자</option>
                <option value="admin">관리자</option>
              </select>
            </div>
          ))}
          {!roles.length && (
            <p className="text-sm text-zinc-500">매핑 가능한 역할이 없습니다. 디스코드에서 역할을 먼저 만들어주세요.</p>
          )}
        </div>
      </section>

      {/* 가입 승인 시 부여할 역할 */}
      <section className="card space-y-3">
        <h2 className="font-semibold text-white">가입 승인 시 자동 부여할 역할</h2>
        <select name="approved" className="input" defaultValue={approvedMemberRoleId}>
          <option value="">사용 안 함</option>
          {roles.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
        <p className="text-xs text-zinc-500">
          ※ 봇이 역할을 부여하려면, 서버 역할 목록에서 봇 역할이 이 역할보다 위에 있어야 합니다.
        </p>
      </section>

      {err && <p className="text-sm text-red-400">{err}</p>}

      <button type="submit" className="btn-primary" disabled={pending}>
        {pending ? "저장 중..." : reconfigure ? "설정 업데이트" : "설정 완료"}
      </button>
    </form>
  );
}
