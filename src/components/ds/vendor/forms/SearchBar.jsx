/* DS component extracted from design-system bundle. Do not edit by hand. */
import React from "react";

function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  useState
} = React;
/**
 * HIDDEN Guild — SearchBar
 * The reference's search field: a dark sunken bar with a circle-handle
 * magnifier glyph. Used to filter members, posts, chat logs.
 */
function SearchBar({
  value,
  onChange,
  placeholder = "검색",
  onSubmit,
  style = {},
  ...rest
}) {
  const [focus, setFocus] = useState(false);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      height: "var(--control-h-md)",
      padding: "0 16px",
      background: "var(--surface-field)",
      borderRadius: "var(--radius-btn)",
      boxShadow: focus ? "var(--gloss-press), var(--glow-teal)" : "var(--gloss-press)",
      transition: "box-shadow var(--dur-fast) var(--ease-out)",
      ...style
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "16",
    height: "16",
    viewBox: "0 0 16 16",
    fill: "none",
    "aria-hidden": "true",
    style: {
      flex: "none"
    }
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "6.8",
    cy: "6.8",
    r: "5",
    stroke: "var(--gray-300)",
    strokeWidth: "2"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "10.6",
    y1: "10.6",
    x2: "15",
    y2: "15",
    stroke: "var(--gray-300)",
    strokeWidth: "2",
    strokeLinecap: "round"
  })), /*#__PURE__*/React.createElement("input", _extends({
    value: value,
    onChange: onChange,
    placeholder: placeholder,
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    onKeyDown: e => {
      if (e.key === "Enter" && onSubmit) onSubmit(value);
    },
    style: {
      flex: 1,
      minWidth: 0,
      height: "100%",
      border: "none",
      background: "transparent",
      color: "var(--white)",
      fontFamily: "var(--font-body)",
      fontSize: "var(--text-base)",
      outline: "none"
    }
  }, rest)));
}

export { SearchBar };
