// src/ui/ui.js
// UI Controller: Layout mounten, Elemente binden, HUD/Questfeld aktualisieren, Feedback-Overlays anzeigen

import { mountUILayout, bindElements } from "./ui-layout.js";

let els = null;
let _toastTimer = null;
let _celebrateTimer = null;
let _oopsTimer = null;

/* =========================================================
   INIT
========================================================= */

export function initUI(rootEl = document.getElementById("app")) {
  if (!rootEl) throw new Error("UI initUI: Root-Element #app nicht gefunden.");

  mountUILayout(rootEl);
  els = bindElements();

  // Default State
  safeSetText(els.sceneTitle, "–");
  safeSetText(els.readText, "–");
  safeSetText(els.question, "–");
  safeSetText(els.statusLine, "Status: offen");

  setButtonsEnabled({ next: false });
  renderDots(3, 0);
  hideBossHud();

  if (els.drawer) els.drawer.classList.remove("open");

  if (els.sceneImg) {
    els.sceneImg.addEventListener("error", () => {
      if (els.sceneFallback) els.sceneFallback.style.display = "grid";
    });
    els.sceneImg.addEventListener("load", () => {
      if (els.sceneFallback) els.sceneFallback.style.display = "none";
    });
  }

  return els;
}

export function getUI() {
  if (!els) throw new Error("UI getUI: initUI() zuerst aufrufen.");
  return els;
}

/* =========================================================
   HUD
========================================================= */

export function setHUD({
  hearts = null,
  stars = null,
  apples = null,
  lanterns = null,
  sparks = null,
  streak = null,
  level = null,
  focus = null,
  xp = null,
  xpNeed = null,
} = {}) {

  if (!els) return;

  if (typeof stars === "number") safeSetText(els.starsVal, stars);
  if (typeof apples === "number") safeSetText(els.applesVal, apples);
  if (typeof lanterns === "number") safeSetText(els.lanternsVal, lanterns);
  if (typeof sparks === "number") safeSetText(els.sparksVal, sparks);

  if (typeof streak === "number") safeSetText(els.streakVal, streak);
  if (typeof level === "number") safeSetText(els.levelVal, level);
  if (typeof focus === "string") safeSetText(els.focusVal, focus);

  if (typeof xp === "number") safeSetText(els.xpVal, xp);
  if (typeof xpNeed === "number") safeSetText(els.xpNeed, xpNeed);

  if (typeof xp === "number" && typeof xpNeed === "number") {
    setXPBar(xp, xpNeed);
  }

  if (typeof hearts === "number") setHearts(hearts);
}

export function setHearts(count) {
  if (!els) return;

  const max = 3;
  const c = Math.max(0, Math.min(max, Number(count)));

  [els.heart1, els.heart2, els.heart3].forEach((heart, i) => {
    const on = i < c;
    heart.style.opacity = on ? "1" : "0.25";
    heart.style.filter = on ? "none" : "grayscale(1)";
  });

  pulse(els.pillHearts);
}

export function setXPBar(xp, need) {
  if (!els?.xpBar) return;

  const pct = Math.max(0, Math.min(1, xp / Math.max(1, need)));
  els.xpBar.style.width = `${Math.round(pct * 100)}%`;

  pulse(els.pillXP);
}

function pulse(el) {
  if (!el) return;
  el.classList.remove("pulse");
  void el.offsetHeight;
  el.classList.add("pulse");
}

/* =========================================================
   SCENE
========================================================= */

export function setScene({ title = "", img = "" } = {}) {
  if (!els) return;

  safeSetText(els.sceneTitle, title);

  if (img) {
    els.sceneImg.src = img;
  }
}

export function clearOverlay() {
  if (!els?.overlay) return;
  els.overlay.innerHTML = "";
}

/* =========================================================
   OVERLAY HOTSPOT SYSTEM (ROBUST)
========================================================= */

/*
  addHotspot({
     img: "assets/ui/icons/herz.png",
     x: 62,          // Prozent (0-100)
     y: 34,          // Prozent (0-100)
     size: 90,       // optional px Referenz
     onClick: fn
  })
*/

export function addHotspot({ img, x = 50, y = 50, size = null, onClick = null }) {
  if (!els?.overlay) return null;

  const node = document.createElement("img");
  node.src = img;
  node.style.position = "absolute";

  node.style.left = `${x}%`;
  node.style.top = `${y}%`;

  node.style.transform = "translate(-50%, -50%)";

  if (size) {
    node.style.setProperty("--ovw", size + "px");
  }

  if (typeof onClick === "function") {
    node.style.cursor = "pointer";
    node.addEventListener("click", onClick);
  }

  els.overlay.appendChild(node);
  return node;
}

/* =========================================================
   QUEST
========================================================= */

export function setReadText(text) {
  safeSetText(els.readText, text);
}

export function setQuestion(text) {
  safeSetText(els.question, text);
}

export function setStatus(text) {
  safeSetText(els.statusLine, text);
}

export function setButtonsEnabled({ next = null, reread = null } = {}) {
  if (typeof next === "boolean") els.nextBtn.disabled = !next;
  if (typeof reread === "boolean") els.reReadBtn.disabled = !reread;
}

export function setAnswers(answers = [], { onPick = null } = {}) {
  if (!els?.answers) return;

  els.answers.innerHTML = "";

  answers.forEach((label, index) => {
    const btn = document.createElement("div");
    btn.className = "ans";
    btn.textContent = label;
    btn.onclick = () => onPick?.(index);
    els.answers.appendChild(btn);
  });
}

export function markAnswer(index, state) {
  const el = els.answers?.children[index];
  if (!el) return;

  el.classList.remove("correct", "wrong");
  el.classList.add(state);
}

/* =========================================================
   BOSS
========================================================= */

export function showBossHud({ name = "Boss", hp = 9, max = 9 }) {
  els.bossHud.style.display = "flex";
  els.bossName.textContent = name;
  els.bossHPText.textContent = hp;

  const pct = Math.max(0, Math.min(1, hp / max));
  els.bossBarFill.style.width = `${pct * 100}%`;
}

export function hideBossHud() {
  els.bossHud.style.display = "none";
}

export function bossTakeHit({ dmg = 1, hp = 8, max = 9 }) {
  showBossHud({ hp, max });
  els.dmg.textContent = `-${dmg}`;
  els.dmg.classList.remove("show");
  void els.dmg.offsetHeight;
  els.dmg.classList.add("show");
}

/* =========================================================
   FEEDBACK
========================================================= */

export function showToast(msg, ms = 1500) {
  clearTimeout(_toastTimer);
  els.toast.textContent = msg;
  els.toast.classList.add("show");

  _toastTimer = setTimeout(() => {
    els.toast.classList.remove("show");
  }, ms);
}

export function showCelebrate(text = "Richtig", ms = 800) {
  clearTimeout(_celebrateTimer);
  els.celebrateText.textContent = text;
  els.celebrate.classList.add("show");

  _celebrateTimer = setTimeout(() => {
    els.celebrate.classList.remove("show");
  }, ms);
}

export function showOops(text = "Nicht richtig", ms = 800) {
  clearTimeout(_oopsTimer);
  els.oopsText.textContent = text;
  els.oops.classList.add("show");

  _oopsTimer = setTimeout(() => {
    els.oops.classList.remove("show");
  }, ms);
}

/* =========================================================
   HELPERS
========================================================= */

function safeSetText(node, value) {
  if (!node) return;
  node.textContent = String(value ?? "");
}
