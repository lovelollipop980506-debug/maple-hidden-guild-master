"use client";

/** 정본 디자인의 하단 토스트(.toast). 어디서든 toast("...") 호출. */
export function toast(msg: string) {
  if (typeof document === "undefined") return;
  let el = document.getElementById("hd-toast") as (HTMLDivElement & { _t?: number }) | null;
  if (!el) {
    el = document.createElement("div");
    el.id = "hd-toast";
    el.className = "toast";
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add("show");
  window.clearTimeout(el._t);
  el._t = window.setTimeout(() => el!.classList.remove("show"), 1800);
}
