"use client";

import { signIn, signOut } from "next-auth/react";

export function SignInButton() {
  return (
    <button className="btn-primary" onClick={() => signIn("discord")}>
      Discord로 로그인
    </button>
  );
}

export function SignOutButton() {
  return (
    <button className="btn-ghost" onClick={() => signOut({ callbackUrl: "/" })}>
      로그아웃
    </button>
  );
}
