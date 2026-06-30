"use client";
import * as React from "react";

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "style"> {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  options: { value: string; label: string }[];
  style?: React.CSSProperties;
}

/** 디자인 시스템 Field 룩에 맞춘 드롭다운(Select). 알림 채널·등급 매핑 등에 사용. */
export function Select({ label, hint, error, options, id, style, ...rest }: SelectProps) {
  const autoId = React.useId();
  const selectId = id || autoId;
  return (
    <div style={{ display: "block", ...style }}>
      {label && (
        <label
          htmlFor={selectId}
          style={{
            display: "block",
            marginBottom: 8,
            fontFamily: "var(--font-display)",
            fontSize: "var(--text-sm)",
            color: error ? "var(--red-500)" : "var(--text-label)",
          }}
        >
          {label}
        </label>
      )}
      <div style={{ position: "relative" }}>
        <select
          id={selectId}
          aria-invalid={!!error}
          {...rest}
          style={{
            width: "100%",
            appearance: "none",
            height: 44,
            padding: "0 38px 0 14px",
            fontFamily: "var(--font-body)",
            fontSize: "var(--text-base)",
            color: "var(--white)",
            background: "var(--surface-field)",
            border: error ? "1px solid var(--red-500)" : "1px solid var(--border-line)",
            borderRadius: "var(--radius-chip)",
            boxShadow: "var(--gloss-press)",
            outline: "none",
          }}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value} style={{ background: "var(--char-800)" }}>
              {o.label}
            </option>
          ))}
        </select>
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            right: 14,
            top: "50%",
            transform: "translateY(-50%)",
            pointerEvents: "none",
            color: "var(--gray-400)",
          }}
        >
          ▾
        </span>
      </div>
      {(error || hint) && (
        <div
          style={{
            marginTop: 6,
            fontSize: "var(--text-sm)",
            color: error ? "var(--red-500)" : "var(--text-muted)",
          }}
        >
          {error || hint}
        </div>
      )}
    </div>
  );
}
