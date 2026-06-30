"use client";
import { useRouter } from "next/navigation";
import { useApi } from "@/lib/client/useApi";
import { Loading } from "@/components/Loading";
import type { Notice } from "@/lib/client/types";

function fmt(d: string | null) {
  if (!d) return "";
  const x = new Date(d + "T00:00:00");
  return isNaN(x.getTime()) ? d : `${x.getFullYear()}.${String(x.getMonth() + 1).padStart(2, "0")}.${String(x.getDate()).padStart(2, "0")}`;
}

export default function NoticesPage() {
  const router = useRouter();
  const { data: notices, loading } = useApi<Notice[]>("/api/v1/notices");
  const list = notices ?? [];

  if (loading && !notices) return <Loading />;

  return (
    <section className="viewPage active">
        <div className="page-head">
          <div>
            <h2>공지사항</h2>
            <p>운영진이 등록한 공지와 안내입니다.</p>
          </div>
          <button className="more" onClick={() => router.push("/")}>
            ← 홈으로
          </button>
        </div>

        <div className="card" style={{ padding: 22 }}>
          {list.length === 0 ? (
            <div className="empty">등록된 공지사항이 없습니다.</div>
          ) : (
            <div className="notice-modal-list">
              {list.map((n) => (
                <div key={n.id} className="notice-modal-item">
                  <small>{fmt(n.notice_date)}</small>
                  <h3>{n.title}</h3>
                  <p>{n.body}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
  );
}
