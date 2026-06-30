/* DS component extracted from design-system bundle. Do not edit by hand. */
import React from "react";

function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  useState
} = React;
/**
 * HIDDEN Guild — Button
 * The glossy game-UI action control: rounded, white top-sheen, sinks on press.
 * Pixel (Galmuri) label. Variants map to the MapleStory Worlds reference:
 * teal primary, slate secondary (tan label), moss quiet, red danger, ghost.
 */
function Button({
  children,
  variant = "primary",
  size = "md",
  disabled = false,
  block = false,
  icon = null,
  type = "button",
  onClick,
  style = {},
  ...rest
}) {
  const [hover, setHover] = useState(false);
  const [active, setActive] = useState(false);
  const SIZES = {
    sm: {
      height: "var(--control-h-sm)",
      padding: "0 16px",
      font: "13px"
    },
    md: {
      height: "var(--control-h-md)",
      padding: "0 24px",
      font: "16px"
    },
    lg: {
      height: "var(--control-h-lg)",
      padding: "0 32px",
      font: "18px"
    }
  };
  const VARIANTS = {
    primary: {
      bg: "var(--teal-500)",
      bgHover: "var(--teal-300)",
      color: "var(--text-on-teal)"
    },
    secondary: {
      bg: "var(--char-750)",
      bgHover: "var(--char-600)",
      color: "var(--tan-300)"
    },
    quiet: {
      bg: "var(--char-700, #444a4a)",
      bgHover: "var(--char-600)",
      color: "var(--gray-300)"
    },
    danger: {
      bg: "var(--red-500)",
      bgHover: "#d4554b",
      color: "#fff"
    },
    ghost: {
      bg: "transparent",
      bgHover: "rgba(255,255,255,0.06)",
      color: "var(--tan-300)"
    }
  };
  const s = SIZES[size] || SIZES.md;
  const v = VARIANTS[variant] || VARIANTS.primary;
  const boxShadow = active ? "var(--gloss-press)" : variant === "ghost" ? "none" : "var(--gloss-strong), var(--shadow-sm)";
  return /*#__PURE__*/React.createElement("button", _extends({
    type: type,
    disabled: disabled,
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => {
      setHover(false);
      setActive(false);
    },
    onMouseDown: () => setActive(true),
    onMouseUp: () => setActive(false),
    style: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "8px",
      width: block ? "100%" : "auto",
      height: s.height,
      padding: s.padding,
      fontFamily: "var(--font-display)",
      fontSize: s.font,
      fontWeight: 700,
      letterSpacing: "var(--tracking-pixel)",
      color: v.color,
      background: hover && !disabled ? v.bgHover : v.bg,
      border: "none",
      borderRadius: "var(--radius-btn)",
      boxShadow,
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.45 : 1,
      transform: active && !disabled ? "translateY(2px)" : "translateY(0)",
      transition: "transform var(--dur-fast) var(--ease-out)",
      userSelect: "none",
      ...style
    }
  }, rest), icon && /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      marginTop: "-2px"
    }
  }, icon), children);
}

export { Button };
