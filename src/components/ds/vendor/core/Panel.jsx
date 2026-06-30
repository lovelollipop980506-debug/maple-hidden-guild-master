/* DS component extracted from design-system bundle. Do not edit by hand. */
import React from "react";

function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * HIDDEN Guild — Panel
 * The dark rounded glossy container (a MapleStory "window"). Optional title
 * bar with a warm tan heading and a close (X) affordance.
 */
function Panel({
  children,
  title = null,
  onClose = null,
  variant = "default",
  // default | raised | inset
  pad = true,
  style = {},
  bodyStyle = {},
  ...rest
}) {
  const BG = {
    default: "var(--surface-panel)",
    raised: "var(--surface-panel-raised)",
    inset: "var(--surface-inset)"
  };
  const shadow = variant === "inset" ? "var(--gloss-press)" : "var(--gloss-soft), var(--shadow-md)";
  return /*#__PURE__*/React.createElement("section", _extends({
    style: {
      background: BG[variant] || BG.default,
      borderRadius: "var(--radius-panel)",
      boxShadow: shadow,
      overflow: "hidden",
      ...style
    }
  }, rest), title !== null && /*#__PURE__*/React.createElement("header", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "14px 20px",
      borderBottom: "1px solid var(--border-hairline)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-display)",
      fontWeight: 700,
      fontSize: "var(--text-md)",
      letterSpacing: "var(--tracking-pixel)",
      color: "var(--text-label)"
    }
  }, title), onClose && /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    "aria-label": "\uB2EB\uAE30",
    style: {
      width: 26,
      height: 26,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      background: "var(--char-600)",
      color: "var(--gray-300)",
      border: "none",
      borderRadius: "var(--radius-sm)",
      fontFamily: "var(--font-display)",
      fontSize: 13,
      cursor: "pointer",
      boxShadow: "var(--gloss-strong)"
    }
  }, "\u2715")), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: pad ? "20px" : 0,
      ...bodyStyle
    }
  }, children));
}

export { Panel };
