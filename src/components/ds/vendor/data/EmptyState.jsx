/* DS component extracted from design-system bundle. Do not edit by hand. */
import React from "react";

function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * HIDDEN Guild — EmptyState
 * Friendly "nothing here yet" placeholder for empty queues, histories and
 * search results. Big quiet glyph, message, optional action.
 */
function EmptyState({
  glyph = "🍄",
  title,
  hint = null,
  action = null,
  style = {},
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      textAlign: "center",
      gap: 10,
      padding: "40px 24px",
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 40,
      opacity: 0.6,
      filter: "grayscale(0.3)",
      lineHeight: 1
    },
    "aria-hidden": "true"
  }, glyph), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-display)",
      fontWeight: 700,
      fontSize: "var(--text-lg)",
      color: "var(--tan-400)"
    }
  }, title), hint && /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-body)",
      fontSize: "var(--text-sm)",
      color: "var(--text-muted)",
      maxWidth: 320
    }
  }, hint), action && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 8
    }
  }, action));
}

export { EmptyState };
