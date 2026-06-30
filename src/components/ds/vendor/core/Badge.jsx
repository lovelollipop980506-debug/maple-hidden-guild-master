/* DS component extracted from design-system bundle. Do not edit by hand. */
import React from "react";

function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * HIDDEN Guild — Badge
 * Compact status / tier / count pill. Soft tinted fill + saturated text,
 * or a solid variant for tier ranks. Pixel font for that HUD-label feel.
 */
const TONES = {
  approved: {
    fill: "var(--status-approved-soft)",
    text: "var(--status-approved)",
    dot: "var(--status-approved)"
  },
  pending: {
    fill: "var(--status-pending-soft)",
    text: "var(--status-pending)",
    dot: "var(--status-pending)"
  },
  rejected: {
    fill: "var(--status-rejected-soft)",
    text: "var(--status-rejected)",
    dot: "var(--status-rejected)"
  },
  teal: {
    fill: "rgba(17,119,153,0.18)",
    text: "var(--teal-300)",
    dot: "var(--teal-300)"
  },
  neutral: {
    fill: "rgba(255,255,255,0.07)",
    text: "var(--gray-300)",
    dot: "var(--gray-400)"
  },
  admin: {
    fill: "rgba(17,119,153,0.20)",
    text: "var(--teal-300)",
    dot: "var(--tier-admin)"
  },
  reviewer: {
    fill: "rgba(222,189,147,0.16)",
    text: "var(--tan-300)",
    dot: "var(--tier-reviewer)"
  },
  member: {
    fill: "rgba(255,255,255,0.07)",
    text: "var(--gray-300)",
    dot: "var(--tier-member)"
  },
  guest: {
    fill: "rgba(255,255,255,0.05)",
    text: "var(--gray-400)",
    dot: "var(--tier-guest)"
  }
};
function Badge({
  children,
  tone = "neutral",
  dot = false,
  solid = false,
  style = {},
  ...rest
}) {
  const t = TONES[tone] || TONES.neutral;
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
      height: "22px",
      padding: "0 10px",
      fontFamily: "var(--font-display)",
      fontSize: "11px",
      fontWeight: 700,
      letterSpacing: "var(--tracking-pixel)",
      color: solid ? "var(--char-950)" : t.text,
      background: solid ? t.dot : t.fill,
      borderRadius: "var(--radius-sm)",
      boxShadow: solid ? "var(--gloss-strong)" : "none",
      whiteSpace: "nowrap",
      ...style
    }
  }, rest), dot && /*#__PURE__*/React.createElement("span", {
    style: {
      width: 7,
      height: 7,
      borderRadius: "50%",
      background: t.dot,
      flex: "none"
    }
  }), children);
}

export { Badge };
