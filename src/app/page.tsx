/**
 * Placeholder root page. The frontend (Claude design) will be added to this
 * Next.js project later; for now this is a backend-only deployment.
 */
export default function Home() {
  return (
    <main style={{ fontFamily: "system-ui", padding: "2rem", color: "#e4e4e7", background: "#1e1f22", minHeight: "100vh" }}>
      <h1>HD Guild — Backend</h1>
      <p>API 서버가 동작 중입니다. 프론트엔드는 추후 추가됩니다.</p>
      <p>
        API 문서: <code>docs/API.md</code> · 로그인: <code>/api/auth/signin</code>
      </p>
    </main>
  );
}
