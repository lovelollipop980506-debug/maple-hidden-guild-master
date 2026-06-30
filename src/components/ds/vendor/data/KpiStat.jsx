/* DS component extracted from design-system bundle. Do not edit by hand. */
import React from "react";

function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * HIDDEN Guild — KpiStat
 * A dashboard stat tile: pixel-friendly big number with a quiet label, on a
 * glossy panel. Optional accent color + icon for the stats overview.
 */
function KpiStat({
  label,
  value,
  icon = null,
  accent = "var(--teal-300)",
  suffix = "",
  style = {},
  ...rest
}) {
  const n = typeof value === "number" ? value.toLocaleString("ko-KR") : value;
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      background: "var(--surface-panel)",
      borderRadius: "var(--radius-panel)",
      boxShadow: "var(--gloss-soft), var(--shadow-md)",
      padding: "18px 20px",
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8
    }
  }, icon && /*#__PURE__*/React.createElement("span", {
    style: {
      color: accent,
      display: "inline-flex"
    }
  }, icon), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-body)",
      fontSize: "var(--text-sm)",
      color: "var(--text-muted)"
    }
  }, label)), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 8,
      fontFamily: "var(--font-numeric)",
      fontWeight: 700,
      fontSize: "var(--display-sm)",
      color: accent,
      letterSpacing: "var(--tracking-pixel)",
      lineHeight: 1
    }
  }, n, suffix && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--text-md)",
      marginLeft: 3
    }
  }, suffix)));
}

export { KpiStat };
