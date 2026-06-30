/* DS component extracted from design-system bundle. Do not edit by hand. */
import React from "react";

function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  useState
} = React;
/**
 * HIDDEN Guild — ListRow
 * The reference's community-post / member row: leading avatar or icon, a
 * title + subtitle, and a trailing slot (badge, points, actions). Hover lifts
 * to the panel-hover surface. Versatile across members, chat logs,
 * applications and skill verifications.
 */
function ListRow({
  leading = null,
  title,
  subtitle = null,
  meta = null,
  trailing = null,
  onClick = null,
  style = {},
  ...rest
}) {
  const [hover, setHover] = useState(false);
  const interactive = !!onClick;
  return /*#__PURE__*/React.createElement("div", _extends({
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: "flex",
      alignItems: "center",
      gap: 14,
      padding: "12px 16px",
      background: hover && interactive ? "var(--surface-panel-hover)" : "var(--surface-panel)",
      borderRadius: "var(--radius-chip)",
      boxShadow: "var(--gloss-soft)",
      cursor: interactive ? "pointer" : "default",
      transition: "background var(--dur-fast) var(--ease-out)",
      ...style
    }
  }, rest), leading && /*#__PURE__*/React.createElement("div", {
    style: {
      flex: "none",
      display: "flex"
    }
  }, leading), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-display)",
      fontWeight: 700,
      fontSize: "var(--text-md)",
      color: "var(--white)",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    }
  }, title), subtitle && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 3,
      fontFamily: "var(--font-body)",
      fontSize: "var(--text-sm)",
      color: "var(--text-muted)",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    }
  }, subtitle)), meta && /*#__PURE__*/React.createElement("div", {
    style: {
      flex: "none",
      fontFamily: "var(--font-pixel-sm)",
      fontSize: "var(--text-xs)",
      color: "var(--text-muted)"
    }
  }, meta), trailing && /*#__PURE__*/React.createElement("div", {
    style: {
      flex: "none",
      display: "flex",
      alignItems: "center",
      gap: 8
    }
  }, trailing));
}

export { ListRow };
