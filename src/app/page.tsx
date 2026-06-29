import Link from "next/link";
import { auth } from "@/auth";
import { getConfig } from "@/lib/config";
import { can, type Tier } from "@/lib/rbac";

export default async function Home() {
  const session = await auth();
  const config = await getConfig();
  const tier = (session?.user?.tier as Tier) ?? "guest";
  const loggedIn = !!session?.user?.discordId;

  return (
    <div className="space-y-8">
      {loggedIn && !config.setupCompleted && (
        <Link
          href="/setup"
          className="block rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-amber-200 transition-colors hover:bg-amber-500/20"
        >
          ⚙️ <strong>초기 설정이 필요합니다.</strong> 디스코드 서버 소유자라면 여기서 연동을 완료하세요. →
        </Link>
      )}
      <section className="card">
        <h1 className="text-2xl font-bold text-white">HD Guild 관리 사이트</h1>
        <p className="mt-2 text-zinc-400">
          디스코드 계정으로 로그인하여 가입 신청, 스킬 포인트 인증을 진행하세요.
          운영자는 검토·멤버 관리·통계를 확인할 수 있습니다.
        </p>
        {!loggedIn && (
          <p className="mt-4 text-sm text-zinc-500">
            우측 상단의 <span className="text-discord-blurple">Discord로 로그인</span> 버튼으로 시작하세요.
          </p>
        )}
      </section>

      {loggedIn && (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card href="/apply" title="가입 신청서" desc="길드 가입을 신청합니다." />
          {can(tier, "skills.submit") && (
            <Card href="/skills" title="스킬 포인트 인증" desc="기록을 제출하고 승인을 받습니다." />
          )}
          {can(tier, "applications.review") && (
            <Card href="/admin/applications" title="신청서 검토" desc="가입 신청을 승인/반려합니다." />
          )}
          {can(tier, "skills.review") && (
            <Card href="/admin/skills" title="인증 검토" desc="스킬 인증을 승인/반려합니다." />
          )}
          {can(tier, "members.manage") && (
            <Card href="/admin/members" title="멤버 관리" desc="멤버와 포인트를 관리합니다." />
          )}
          {can(tier, "messages.view") && (
            <Card href="/admin/messages" title="채팅 로그" desc="수집된 디스코드 채팅을 검토합니다." />
          )}
          {can(tier, "stats.view") && (
            <Card href="/admin/stats" title="통계" desc="길드 현황을 한눈에 봅니다." />
          )}
        </section>
      )}
    </div>
  );
}

function Card({ href, title, desc }: { href: string; title: string; desc: string }) {
  return (
    <Link href={href} className="card transition-colors hover:border-discord-blurple">
      <h2 className="font-semibold text-white">{title}</h2>
      <p className="mt-1 text-sm text-zinc-400">{desc}</p>
    </Link>
  );
}
