"use client";
import { useState } from "react";
import { useApi } from "@/lib/client/useApi";
import { apiPost, apiPut, apiDelete, ApiError } from "@/lib/client/api";
import { toast } from "@/lib/client/toast";
import { Loading } from "@/components/Loading";
import { AsyncButton } from "@/components/AsyncButton";
import type { Notice } from "@/lib/client/types";

export function NoticesAdmin() {
  const { data, loading, reload } = useApi<Notice[]>("/api/v1/notices?all=1");
  const list = data ?? [];
  const [editId, setEditId] = useState<string | null>(null);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  if (loading && !data) return <Loading />;

  function clear() {
    setEditId(null);
    setDate(new Date().toISOString().slice(0, 10));
    setTitle("");
    setBody("");
  }

  async function save() {
    if (!title.trim()) return toast("공지 제목을 입력하세요");
    if (!body.trim()) return toast("공지 내용을 입력하세요");
    try {
      const payload = { title: title.trim(), body: body.trim(), noticeDate: date };
      if (editId) await apiPut(`/api/v1/notices/${editId}`, payload);
      else await apiPost("/api/v1/notices", payload);
      toast("공지사항을 저장했습니다");
      clear();
      reload();
    } catch (e) {
      toast((e as ApiError).message);
    }
  }

  function edit(n: Notice) {
    setEditId(n.id);
    setDate(n.notice_date || "");
    setTitle(n.title);
    setBody(n.body);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function del(n: Notice) {
    if (!window.confirm("이 공지사항을 삭제할까요?")) return;
    try {
      await apiDelete(`/api/v1/notices/${n.id}`);
      toast("공지사항을 삭제했습니다");
      if (editId === n.id) clear();
      reload();
    } catch (e) {
      toast((e as ApiError).message);
    }
  }

  return (
    <div className="panel active">
      <div className="panel-head">
        <div>
          <h2>공지 관리</h2>
          <p>메인 화면에서 여러 공지가 순서대로 자동 전환됩니다.</p>
        </div>
      </div>

      <div className="card notice-editor" style={{ padding: 18 }}>
        <div className="notice-admin-grid">
          <div className="field">
            <label>날짜</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="field">
            <label>제목 *</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="공지 제목" />
          </div>
          <div className="field full">
            <label>내용 *</label>
            <textarea className="textarea" value={body} onChange={(e) => setBody(e.target.value)} placeholder="공지 내용" />
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn-light" onClick={clear}>
            입력 초기화
          </button>
          <AsyncButton className="btn-save" onClick={save}>
            {editId ? "공지 수정" : "공지 저장"}
          </AsyncButton>
        </div>
      </div>

      <div className="notice-list" style={{ marginTop: 14 }}>
        {list.length === 0 ? (
          <div className="card empty">등록된 공지가 없습니다.</div>
        ) : (
          list.map((n) => (
            <div key={n.id} className="notice-item">
              <div>
                <h4>{n.title}</h4>
                <p>{n.body}</p>
                <small>{n.notice_date || "날짜 없음"}</small>
              </div>
              <div className="notice-actions">
                <button className="small-btn edit" onClick={() => edit(n)}>
                  수정
                </button>
                <AsyncButton className="small-btn reject" onClick={() => del(n)}>
                  삭제
                </AsyncButton>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
