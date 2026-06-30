/* DS component extracted from design-system bundle. Do not edit by hand. */
import React from "react";

function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * HIDDEN Guild — PointTag
 * Gold "mesos"-style point counter. A coin glyph + monospace pixel number.
 * Used for skill points / guild contribution across the app.
 */
function PointTag({
  value = 0,
  label = "p",
  size = "md",
  style = {},
  ...rest
}) {
  const SIZES = {
    sm: {
      h: 22,
      font: 12,
      coin: 12
    },
    md: {
      h: 28,
      font: 15,
      coin: 15
    },
    lg: {
      h: 38,
      font: 22,
      coin: 20
    }
  };
  const s = SIZES[size] || SIZES.md;
  const n = typeof value === "number" ? value.toLocaleString("ko-KR") : value;
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: "7px",
      height: s.h,
      padding: `0 ${s.h * 0.42}px`,
      background: "rgba(240,200,80,0.14)",
      borderRadius: "var(--radius-sm)",
      boxShadow: "inset 0 0 0 1px rgba(240,200,80,0.32)",
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      width: s.coin,
      height: s.coin,
      borderRadius: "50%",
      background: "radial-gradient(circle at 38% 32%, #ffe9a0 0%, var(--gold-500) 55%, #cba32f 100%)",
      boxShadow: "inset 0 -1px 1px rgba(0,0,0,0.25)",
      flex: "none"
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-numeric)",
      fontWeight: 700,
      fontSize: s.font,
      color: "var(--gold-500)",
      letterSpacing: "var(--tracking-pixel)"
    }
  }, n, label));
}

export { PointTag };
