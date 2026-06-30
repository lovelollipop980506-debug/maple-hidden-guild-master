/* DS component extracted from design-system bundle. Do not edit by hand. */
import React from "react";

function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  useState
} = React;
/**
 * HIDDEN Guild — Textarea
 * Multi-line input on a sunken dark field. Matches Field styling; used for
 * application motivation, review notes, skill descriptions.
 */
function Textarea({
  label = null,
  hint = null,
  error = null,
  rows = 4,
  value,
  onChange,
  placeholder = "",
  disabled = false,
  id,
  style = {},
  ...rest
}) {
  const [focus, setFocus] = useState(false);
  const fieldId = id || (label ? `t-${String(label).replace(/\s+/g, "-")}` : undefined);
  return /*#__PURE__*/React.createElement("label", {
    htmlFor: fieldId,
    style: {
      display: "block",
      ...style
    }
  }, label && /*#__PURE__*/React.createElement("span", {
    style: {
      display: "block",
      marginBottom: 8,
      fontFamily: "var(--font-display)",
      fontSize: "var(--text-sm)",
      color: "var(--text-label)",
      letterSpacing: "var(--tracking-pixel)"
    }
  }, label), /*#__PURE__*/React.createElement("textarea", _extends({
    id: fieldId,
    rows: rows,
    value: value,
    onChange: onChange,
    placeholder: placeholder,
    disabled: disabled,
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    style: {
      width: "100%",
      padding: "12px 16px",
      fontFamily: "var(--font-body)",
      fontSize: "var(--text-base)",
      lineHeight: "var(--leading-body)",
      color: "var(--white)",
      background: "var(--surface-field)",
      border: "none",
      borderRadius: "var(--radius-chip)",
      boxShadow: error ? "var(--gloss-press), 0 0 0 2px var(--red-500)" : focus ? "var(--gloss-press), var(--glow-teal)" : "var(--gloss-press)",
      outline: "none",
      resize: "vertical",
      opacity: disabled ? 0.5 : 1,
      transition: "box-shadow var(--dur-fast) var(--ease-out)"
    }
  }, rest)), (error || hint) && /*#__PURE__*/React.createElement("span", {
    style: {
      display: "block",
      marginTop: 7,
      fontFamily: "var(--font-body)",
      fontSize: "var(--text-sm)",
      color: error ? "var(--red-300)" : "var(--text-muted)"
    }
  }, error || hint));
}

export { Textarea };
