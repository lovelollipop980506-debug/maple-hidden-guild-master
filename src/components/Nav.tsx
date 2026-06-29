import Link from "next/link";
import { auth } from "@/auth";
import { can, type Tier } from "@/lib/rbac";
import { SignInButton, SignOutButton } from "@/components/AuthButtons";

const TIER_LABEL: Record<Tier, string> = {
  admin: "관리자",
  reviewer: "운영자",
  member: "멤버",
  guest: "게스트",
};

export default async function Nav() {
  const session = await auth();
  const tier = (session?.user?.tier as Tier) ?? "guest";
  const loggedIn = !!session?.user?.discordId;

  return (
    <header className="border-b border-zinc-800 bg-discord-dark">
      <nav className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-4 py-3">
        <Link href="/" className="text-lg font-bold text-white">
          HD Guild
        </Link>

        {loggedIn && (
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <Link href="/apply" className="text-zinc-300 hover:text-white">
              가입 신청
            </Link>
            {can(tier, "skills.submit") && (
              <Link href="/skills" className="text-zinc-300 hover:text-white">
                스킬 인증
              </Link>
            )}
            {can(tier, "applications.review") && (
              <Link href="/admin/applications" className="text-zinc-300 hover:text-white">
                신청서 검토
              </Link>
            )}
            {can(tier, "skills.review") && (
              <Link href="/admin/skills" className="text-zinc-300 hover:text-white">
                인증 검토
              </Link>
            )}
            {can(tier, "members.manage") && (
              <Link href="/admin/members" className="text-zinc-300 hover:text-white">
                멤버 관리
              </Link>
            )}
            {can(tier, "messages.view") && (
              <Link href="/admin/messages" className="text-zinc-300 hover:text-white">
                채팅 로그
              </Link>
            )}
            {can(tier, "stats.view") && (
              <Link href="/admin/stats" className="text-zinc-300 hover:text-white">
                통계
              </Link>
            )}
          </div>
        )}

        <div className="ml-auto flex items-center gap-3">
          {loggedIn ? (
            <>
              <span className="text-sm text-zinc-400">
                {session!.user.name}
                <span className="badge ml-2 bg-zinc-700 text-zinc-200">
                  {TIER_LABEL[tier]}
                </span>
              </span>
              <SignOutButton />
            </>
          ) : (
            <SignInButton />
          )}
        </div>
      </nav>
    </header>
  );
}
