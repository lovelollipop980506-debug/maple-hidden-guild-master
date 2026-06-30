/* DS component extracted from design-system bundle. Do not edit by hand. */
import React from "react";

/**
 * HIDDEN Guild — Tabs
 * Segmented navigation from the reference: the active tab is glossy teal,
 * the rest sit quiet on a slate track. Pill-shaped, game-UI labels.
 */
function Tabs({
  items = [],
  value,
  onChange,
  style = {}
}) {
  return /*#__PURE__*/React.createElement("div", {
    role: "tablist",
    style: {
      display: "inline-flex",
      gap: 6,
      padding: 4,
      background: "var(--surface-inset)",
      borderRadius: "var(--radius-btn)",
      boxShadow: "var(--gloss-press)",
      ...style
    }
  }, items.map(it => {
    const key = typeof it === "string" ? it : it.value;
    const labelText = typeof it === "string" ? it : it.label;
    const active = key === value;
    return /*#__PURE__*/React.createElement("button", {
      key: key,
      role: "tab",
      "aria-selected": active,
      onClick: () => onChange && onChange(key),
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        height: 38,
        padding: "0 20px",
        fontFamily: "var(--font-display)",
        fontWeight: 700,
        fontSize: "var(--text-sm)",
        letterSpacing: "var(--tracking-pixel)",
        color: active ? "var(--white)" : "var(--tan-400)",
        backgroundColor: active ? "var(--teal-500)" : "transparent",
        border: "none",
        borderRadius: "var(--radius-sm)",
        boxShadow: active ? "var(--gloss-strong)" : "none",
        cursor: "pointer",
        transition: "none",
        whiteSpace: "nowrap"
      }
    }, typeof it !== "string" && it.badge != null && /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: "var(--font-pixel-sm)",
        fontSize: 10,
        padding: "1px 6px",
        borderRadius: "var(--radius-sm)",
        background: active ? "rgba(255,255,255,0.25)" : "var(--char-750)",
        color: active ? "#fff" : "var(--tan-300)"
      }
    }, it.badge), labelText);
  }));
}

export { Tabs };
