// src/ui/ui.js
// UI Controller: Layout mounten, Elemente binden, HUD/Questfeld aktualisieren, Feedback-Overlays anzeigen

import { mountUILayout, bindElements } from "./ui-layout.js";

let els = null;
let _toastTimer = null;
let _celebrateTimer = null;
let _oopsTimer = null;

export function initUI(rootEl = document.getElementById("app")) {
  if (!rootEl) throw new Error("UI initUI: Root-Element #app nicht gefunden.");

  mountUILayout(rootEl);
  els = bindElements();

  // Default UI state
  safeSetText(els.sceneTitle, "–");
  safeSetText(els.readText, "–");
  safeSetText(els.question, "–");
  safeSetText(els.statusLine, "Status: offen");
  setButtonsEnabled({ next: false });

  // Dots (3 als default)
  renderDots(3, 0);

  // Drawer
  if (els.drawer) els.drawer.classList.remove("open");

  // Boss UI default
  hideBossHud();

  // Click handlers (UI-only)
  if (els.drawerBtn) els.drawerBtn.addEventListener("click", () => openDrawer(true));
  if (els.drawerCloseBtn) els.drawerCloseBtn.addEventListener("click", () => openDrawer(false));

  // Fallback für Szene (wenn Bild fehlt)
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
  if (!els) throw new Error("UI getUI: UI ist noch nicht initialisiert. initUI() zuerst aufrufen.");
  return els;
}

/* -----------------------------
   HUD / Werte
------------------------------ */

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

  if (typeof stars === "number") safeSetText(els.starsVal, String(stars));
  if (typeof apples === "number") safeSetText(els.applesVal, String(apples));
  if (typeof lanterns === "number") safeSetText(els.lanternsVal, String(lanterns));
  if (typeof sparks === "number") safeSetText(els.sparksVal, String(sparks));

  if (typeof streak === "number") safeSetText(els.streakVal, String(streak));
  if (typeof level === "number") safeSetText(els.levelVal, String(level));
  if (typeof focus === "string") safeSetText(els.focusVal, focus);

  if (typeof xp === "number") safeSetText(els.xpVal, String(xp));
  if (typeof xpNeed === "number") safeSetText(els.xpNeed, String(xpNeed));

  if (typeof xp === "number" && typeof xpNeed === "number") {
    setXPBar(xp, xpNeed);
  }

  if (typeof hearts === "number") setHearts(hearts);
}

export function setHearts(count) {
  if (!els) return;

  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const c = clamp(Number(count ?? 0), 0, 3);

  // Wir nutzen IDs heart1..3 aus ui-layout.js
  const hearts = [els.heart1, els.heart2, els.heart3].filter(Boolean);

  hearts.forEach((img, idx) => {
    const on = idx < c;
    img.style.opacity = on ? "1" : "0.25";
    img.style.filter = on ? "none" : "grayscale(1)";
  });

  pulse(els.pillHearts);
}

export function setXPBar(xp, need) {
  if (!els || !els.xpBar) return;

  const n = Math.max(1, Number(need ?? 1));
  const x = Math.max(0, Number(xp ?? 0));
  const pct = Math.max(0, Math.min(1, x / n));

  els.xpBar.style.width = `${Math.round(pct * 100)}%`;
  pulse(els.pillXP);
}

function pulse(el) {
  if (!el) return;
  el.classList.remove("pulse");
  // reflow
  void el.offsetHeight;
  el.classList.add("pulse");
}

/* -----------------------------
   Szene / Questfeld
------------------------------ */

export function setScene({ title = "", img = "" } = {}) {
  if (!els) return;

  if (typeof title === "string") safeSetText(els.sceneTitle, title);

  if (typeof img === "string" && els.sceneImg) {
    // img ist erwartungsgemäß ein Pfad wie "assets/scenes/waldweg.png"
    els.sceneImg.src = img;
  }
}

export function setReadText(text) {
  if (!els) return;
  safeSetText(els.readText, text ?? "–");
}

export function setQuestion(text) {
  if (!els) return;
  safeSetText(els.question, text ?? "–");
}

export function setStatus(text) {
  if (!els) return;
  safeSetText(els.statusLine, text ?? "Status: offen");
}

export function setButtonsEnabled({ next = null, reread = null } = {}) {
  if (!els) return;

  if (typeof next === "boolean" && els.nextBtn) els.nextBtn.disabled = !next;
  if (typeof reread === "boolean" && els.reReadBtn) els.reReadBtn.disabled = !reread;
}

export function setQuestionProgress(current, total) {
  if (!els) return;

  const c = Number(current ?? 1);
  const t = Number(total ?? 1);

  if (els.qProgress) safeSetText(els.qProgress, `Frage ${c}/${t}`);
  renderDots(t, c - 1);
}

export function renderDots(total = 3, activeIndex = 0) {
  if (!els || !els.dots) return;

  const t = Math.max(1, Number(total));
  const a = Math.max(0, Math.min(t - 1, Number(activeIndex)));

  els.dots.innerHTML = "";
  for (let i = 0; i < t; i++) {
    const d = document.createElement("div");
    d.className = "d" + (i <= a ? " on" : "");
    els.dots.appendChild(d);
  }
}

export function setAnswers(answers = [], { onPick = null, locked = false } = {}) {
  if (!els || !els.answers) return;

  // answers: Array von Strings ODER Array<{label, key?, correct?}>
  els.answers.innerHTML = "";

  const items = Array.isArray(answers) ? answers : [];
  items.forEach((a) => {
    const label = typeof a === "string" ? a : (a?.label ?? "");
    const btn = document.createElement("div");
    btn.className = "ans";
    btn.textContent = label;
    btn.setAttribute("role", "button");
    btn.tabIndex = 0;

    const pick = () => {
      if (locked) return;
      if (typeof onPick === "function") onPick(a);
    };

    btn.addEventListener("click", pick);
    btn.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        pick();
      }
    });

    els.answers.appendChild(btn);
  });
}

export function markAnswer(index, state /* "correct" | "wrong" */) {
  if (!els || !els.answers) return;
  const children = Array.from(els.answers.children);
  const el = children[index];
  if (!el) return;

  el.classList.remove("correct", "wrong");
  if (state === "correct") el.classList.add("correct");
  if (state === "wrong") el.classList.add("wrong");
}

/* -----------------------------
   Drawer / Kapitel
------------------------------ */

export function openDrawer(open = true) {
  if (!els || !els.drawer) return;
  els.drawer.classList.toggle("open", !!open);
}

export function setChapterStatus(text) {
  if (!els) return;
  safeSetText(els.chapterStatus, text ?? "");
}

export function setUnlockHint(text) {
  if (!els) return;
  safeSetText(els.unlockHint, text ?? "");
}

export function setPathListHTML(html) {
  if (!els || !els.pathList) return;
  els.pathList.innerHTML = html ?? "";
}

/* -----------------------------
   Boss HUD
------------------------------ */

export function showBossHud({ name = "Boss", hp = 9, max = 9 } = {}) {
  if (!els || !els.bossHud) return;

  els.bossHud.style.display = "flex";
  safeSetText(els.bossName, name);
  safeSetText(els.bossHPText, String(hp));

  const pct = Math.max(0, Math.min(1, Number(hp) / Math.max(1, Number(max))));
  if (els.bossBarFill) els.bossBarFill.style.width = `${Math.round(pct * 100)}%`;
}

export function hideBossHud() {
  if (!els || !els.bossHud) return;
  els.bossHud.style.display = "none";
}

export function bossTakeHit({ dmg = 1, hp = 8, max = 9 } = {}) {
  if (!els) return;

  // HP Bar
  const pct = Math.max(0, Math.min(1, Number(hp) / Math.max(1, Number(max))));
  if (els.bossBarFill) els.bossBarFill.style.width = `${Math.round(pct * 100)}%`;
  if (els.bossHPText) safeSetText(els.bossHPText, String(hp));

  // Damage popup (wenn vorhanden)
  if (els.dmg) {
    els.dmg.textContent = `-${Number(dmg)}`;
    els.dmg.classList.remove("show");
    void els.dmg.offsetHeight;
    els.dmg.classList.add("show");
  }
}

/* -----------------------------
   Feedback: Toast / Celebrate / Oops
------------------------------ */

export function showToast(message, ms = 1500) {
  if (!els || !els.toast) return;

  clearTimeout(_toastTimer);

  els.toast.textContent = String(message ?? "");
  els.toast.classList.add("show");

  _toastTimer = setTimeout(() => {
    els.toast.classList.remove("show");
  }, Math.max(600, Number(ms)));
}

export function showCelebrate(text = "Richtig", ms = 900) {
  if (!els || !els.celebrate) return;

  clearTimeout(_celebrateTimer);

  if (els.celebrateText) els.celebrateText.textContent = String(text ?? "Richtig");
  els.celebrate.classList.add("show");

  _celebrateTimer = setTimeout(() => {
    els.celebrate.classList.remove("show");
  }, Math.max(450, Number(ms)));
}

export function hideCelebrate() {
  if (!els || !els.celebrate) return;
  els.celebrate.classList.remove("show");
}

export function showOops(text = "Nicht richtig", ms = 900) {
  if (!els || !els.oops) return;

  clearTimeout(_oopsTimer);

  if (els.oopsText) els.oopsText.textContent = String(text ?? "Nicht richtig");
  els.oops.classList.add("show");

  _oopsTimer = setTimeout(() => {
    els.oops.classList.remove("show");
  }, Math.max(450, Number(ms)));
}

export function hideOops() {
  if (!els || !els.oops) return;
  els.oops.classList.remove("show");
}

/* -----------------------------
   Helpers
------------------------------ */

function safeSetText(node, value) {
  if (!node) return;
  node.textContent = String(value ?? "");
}
