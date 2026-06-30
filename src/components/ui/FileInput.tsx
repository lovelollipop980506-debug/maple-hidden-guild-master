"use client";
import * as React from "react";
import { Button, Icon } from "@/components/ds";

interface FileInputProps {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  accept?: string;
  /** 최대 바이트(초과 시 onError 호출). */
  maxBytes?: number;
  onFile: (file: File | null) => void;
  onError?: (message: string) => void;
}

function formatBytes(b: number) {
  if (b < 1024) return `${b}B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)}KB`;
  return `${(b / 1024 / 1024).toFixed(1)}MB`;
}

/** 이미지 업로드 슬롯 — inset + gloss-press, 미리보기/제거 지원. */
export function FileInput({ label, hint, error, accept = "image/*", maxBytes, onFile, onError }: FileInputProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [file, setFile] = React.useState<File | null>(null);
  const [preview, setPreview] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function choose(f: File | null) {
    if (f && maxBytes && f.size > maxBytes) {
      onError?.(`파일이 너무 큽니다 (최대 ${formatBytes(maxBytes)}).`);
      return;
    }
    setFile(f);
    onFile(f);
  }

  return (
    <div>
      {label && (
        <span
          style={{
            display: "block",
            marginBottom: 8,
            fontFamily: "var(--font-display)",
            fontSize: "var(--text-sm)",
            color: error ? "var(--red-500)" : "var(--text-label)",
          }}
        >
          {label}
        </span>
      )}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          choose(e.dataTransfer.files?.[0] ?? null);
        }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: 14,
          background: "var(--surface-inset)",
          borderRadius: "var(--radius-chip)",
          border: error ? "1px solid var(--red-500)" : "1px solid transparent",
          boxShadow: "var(--gloss-press)",
        }}
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt="미리보기"
            style={{ width: 48, height: 48, objectFit: "cover", borderRadius: "var(--radius-chip)" }}
          />
        ) : (
          <Icon name="image" size={28} color="var(--gray-400)" />
        )}
        <span style={{ flex: 1, color: "var(--text-muted)", fontSize: "var(--text-sm)", wordBreak: "break-all" }}>
          {file ? `${file.name} · ${formatBytes(file.size)}` : "스크린샷을 끌어다 놓거나 선택하세요"}
        </span>
        {file ? (
          <Button variant="quiet" size="sm" onClick={() => choose(null)}>
            제거
          </Button>
        ) : (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => inputRef.current?.click()}
            icon={<Icon name="upload" size={15} color="var(--tan-300)" />}
          >
            업로드
          </Button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          hidden
          onChange={(e) => choose(e.target.files?.[0] ?? null)}
        />
      </div>
      {(error || hint) && (
        <div style={{ marginTop: 6, fontSize: "var(--text-sm)", color: error ? "var(--red-500)" : "var(--text-muted)" }}>
          {error || hint}
        </div>
      )}
    </div>
  );
}
