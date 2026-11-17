// Q&A: 開閉アニメーション・検索・リンクで直接開く
(function () {
  "use strict";

  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)");
  var EASE = "cubic-bezier(0.2, 0.8, 0.2, 1)";
  var items = Array.prototype.slice.call(document.querySelectorAll(".faq details"));
  if (!items.length) return;

  function canAnimate(el) {
    return typeof el.animate === "function" && !(reduceMotion && reduceMotion.matches);
  }

  function borderHeight(el) {
    return el.offsetHeight - el.clientHeight;
  }

  function finish(d) {
    clearTimeout(d._timer);
    if (d._anim) { d._anim.onfinish = null; d._anim.cancel(); d._anim = null; }
    d.style.height = "";
    d.classList.remove("is-closing");
  }

  function open(d, animate) {
    if (d.open && !d.classList.contains("is-closing")) return;
    var start = d.offsetHeight;
    finish(d);
    d.open = true;
    if (!animate || !canAnimate(d)) return;
    var end = d.offsetHeight;
    d._anim = d.animate(
      [{ height: start + "px" }, { height: end + "px" }],
      { duration: Math.min(420, 220 + (end - start) * 0.6), easing: EASE }
    );
    d._anim.onfinish = function () { finish(d); };
    d._timer = setTimeout(function () { finish(d); }, 500);
    var answer = d.querySelector(".answer");
    if (answer) {
      answer.animate(
        [{ opacity: 0, transform: "translateY(-6px)" }, { opacity: 1, transform: "none" }],
        { duration: 320, delay: 40, easing: EASE, fill: "backwards" }
      );
    }
  }

  function close(d) {
    if (!d.open || d.classList.contains("is-closing")) return;
    if (!canAnimate(d)) { d.open = false; return; }
    var start = d.offsetHeight;
    var end = d.querySelector("summary").offsetHeight + borderHeight(d);
    finish(d);
    d.classList.add("is-closing");
    var duration = Math.min(360, 200 + (start - end) * 0.5);
    var done = function () {
      finish(d);
      d.open = false;
    };
    d._anim = d.animate(
      [{ height: start + "px" }, { height: end + "px" }],
      { duration: duration, easing: EASE, fill: "forwards" }
    );
    d._anim.onfinish = done;
    // 非表示のWebViewなどでonfinishが来ない場合でも確実に閉じる
    d._timer = setTimeout(done, duration + 80);
  }

  items.forEach(function (d) {
    var summary = d.querySelector("summary");
    summary.addEventListener("click", function (e) {
      e.preventDefault();
      if (d.open && !d.classList.contains("is-closing")) close(d);
      else open(d, true);
    });
  });

  // qa.html#id で該当の質問を開く
  function openFromHash() {
    var id = decodeURIComponent(location.hash.slice(1));
    if (!id) return;
    var target = document.getElementById(id);
    if (target && target.tagName === "DETAILS" && target.closest(".faq")) {
      open(target, false);
      target.scrollIntoView({ block: "start" });
    }
  }
  openFromHash();
  window.addEventListener("hashchange", openFromHash);

  // 検索
  var input = document.getElementById("faq-search");
  var empty = document.getElementById("faq-empty");
  var chips = document.querySelector(".faq-chips");
  var groups = Array.prototype.slice.call(document.querySelectorAll(".faq-group"));
  if (!input) return;

  function normalize(text) {
    return (text.normalize ? text.normalize("NFKC") : text)
      .toLowerCase()
      .replace(/[ァ-ヶ]/g, function (c) { return String.fromCharCode(c.charCodeAt(0) - 0x60); })
      .replace(/\s+/g, " ");
  }

  var index = items.map(function (d) { return normalize(d.textContent); });

  input.addEventListener("input", function () {
    var words = normalize(input.value).trim().split(" ").filter(Boolean);
    var shown = 0;
    items.forEach(function (d, i) {
      var hit = words.every(function (w) { return index[i].indexOf(w) !== -1; });
      d.hidden = !hit;
      if (hit) shown++;
    });
    groups.forEach(function (g) {
      var list = g.nextElementSibling;
      var visible = list && list.querySelector("details:not([hidden])");
      g.hidden = list.hidden = !visible;
    });
    if (chips) chips.hidden = words.length > 0;
    empty.hidden = shown > 0;
  });
})();
