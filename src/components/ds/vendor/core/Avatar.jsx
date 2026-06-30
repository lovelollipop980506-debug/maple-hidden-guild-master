/* DS component extracted from design-system bundle. Do not edit by hand. */
import React from "react";

function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * HIDDEN Guild — Avatar
 * Circular player portrait with a glossy rim and an optional tier-colored ring.
 * Falls back to an initial on a charcoal disc when no image is given.
 */
const TIER_RING = {
  admin: "var(--tier-admin)",
  reviewer: "var(--tier-reviewer)",
  member: "var(--tier-member)",
  guest: "var(--tier-guest)"
};
function Avatar({
  src = null,
  name = "",
  tier = null,
  size = 44,
  online = false,
  style = {},
  ...rest
}) {
  const ring = tier ? TIER_RING[tier] : null;
  const initial = (name || "?").trim().charAt(0).toUpperCase();
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      position: "relative",
      display: "inline-flex",
      width: size,
      height: size,
      flex: "none",
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      width: "100%",
      height: "100%",
      borderRadius: "50%",
      background: src ? `center / cover no-repeat url(${src})` : "var(--char-700)",
      boxShadow: ring ? `0 0 0 2.5px ${ring}, var(--gloss-strong)` : "inset 0 0 0 1px rgba(255,255,255,0.12), var(--gloss-strong)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "var(--font-display)",
      fontSize: size * 0.4,
      fontWeight: 700,
      color: "var(--tan-300)",
      overflow: "hidden"
    }
  }, !src && initial), online && /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      right: 0,
      bottom: 0,
      width: size * 0.28,
      height: size * 0.28,
      borderRadius: "50%",
      background: "var(--green-500)",
      boxShadow: "0 0 0 2.5px var(--surface-panel)"
    }
  }));
}

export { Avatar };
