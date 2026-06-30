/* DS component extracted from design-system bundle. Do not edit by hand. */
import React from "react";

function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  useState
} = React;
/**
 * HIDDEN Guild — Field
 * Labeled text input on a sunken dark field. Pixel label, soft inner shadow,
 * teal focus ring. Supports a hint / error line beneath.
 */
function Field({
  label = null,
  hint = null,
  error = null,
  type = "text",
  value,
  onChange,
  placeholder = "",
  disabled = false,
  id,
  style = {},
  ...rest
}) {
  const [focus, setFocus] = useState(false);
  const fieldId = id || (label ? `f-${String(label).replace(/\s+/g, "-")}` : undefined);
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
  }, label), /*#__PURE__*/React.createElement("input", _extends({
    id: fieldId,
    type: type,
    value: value,
    onChange: onChange,
    placeholder: placeholder,
    disabled: disabled,
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    style: {
      width: "100%",
      height: "var(--control-h-md)",
      padding: "0 16px",
      fontFamily: "var(--font-body)",
      fontSize: "var(--text-base)",
      color: "var(--white)",
      background: "var(--surface-field)",
      border: "none",
      borderRadius: "var(--radius-chip)",
      boxShadow: error ? "var(--gloss-press), 0 0 0 2px var(--red-500)" : focus ? "var(--gloss-press), var(--glow-teal)" : "var(--gloss-press)",
      outline: "none",
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

export { Field };
