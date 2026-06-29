import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SignInButton } from "@/components/AuthButtons";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user?.discordId) redirect("/");

  return (
    <div className="mx-auto max-w-md">
      <div className="card text-center">
        <h1 className="text-xl font-bold text-white">로그인</h1>
        <p className="mt-2 text-sm text-zinc-400">
          디스코드 계정으로 로그인합니다. 길드 역할에 따라 사용할 수 있는 기능이 결정됩니다.
        </p>
        <div className="mt-6 flex justify-center">
          <SignInButton />
        </div>
      </div>
    </div>
  );
}
