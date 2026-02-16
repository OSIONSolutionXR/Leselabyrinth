// src/game/game.js

import { mountUILayout, bindElements } from "../ui/ui-layout.js";
import * as U from "../core/utils.js";
import * as State from "../core/state.js";

import { ASSETS } from "../data/assets.js";
import { NODES } from "../data/nodes.js";

import { renderBossUI, bossHitFX } from "./boss.js";
import { burstAtHotspot, flyToHUD } from "./interactions.js";

// ------------------------------------------------------------
// Robust Fallbacks
// ------------------------------------------------------------
const clamp =
  U.clamp ||
  ((v, min, max) => (v < min ? min : v > max ? max : v));

const vibrate =
  U.vibrate ||
  ((ms) => {
    try {
      if (navigator.vibrate) navigator.vibrate(ms);
    } catch {}
  });

// deterministic shuffle (stable but mixed)
function hash32(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  return h >>> 0;
}
function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function shuffledAnswersWithKey(answers, seedKey) {
  const seed = hash32(String(seedKey || ""));
  const rnd = mulberry32(seed);
  const arr = (answers || []).map((a, idx) => ({ a, idx }));
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ------------------------------------------------------------
// Boot
// ------------------------------------------------------------
const root = document.getElementById("app");
mountUILayout(root);
const el = bindElements();

// State
let state =
  (State.loadState && State.loadState()) ||
  (State.defaultState && State.defaultState()) ||
  null;

if (!state) {
  state = {
    nodeIndex: 0,
    unlocked: [true, false, false, false, false],
    completed: [false, false, false, false, false],
    stars: 0,
    apples: 0,
    lanterns: 0,
    sparks: 0,
    streak: 0,
    level: 1,
    xp: 0,
    xpNeed: 110,
    heartsMax: 3,
    hearts: 3,
    focus: "W-Frage",
    scene: NODES.map((n) => ({
      tries: 0,
      answered: false,
      perfect: true,
      sparkFound: false,
      collected: {},
      qIndex: 0,
      correctSteps: [false, false, false],
      xpGrantedSteps: [false, false, false],
      bossHP: n.boss ? n.boss.hpMax : 0,
      bossStep: 0,
      bossXpGrantedSteps: Array(9).fill(false),
    })),
  };
}

// ------------------------------------------------------------
// UI helper (ohne extra ui.js Abhängigkeit)
// ------------------------------------------------------------
let _toastTimer = null;
let _celebrateTimer = null;
let _oopsTimer = null;

function showToast(msg, ms = 1500) {
  clearTimeout(_toastTimer);
  el.toast.textContent = String(msg ?? "");
  el.toast.classList.add("show");
  _toastTimer = setTimeout(() => el.toast.classList.remove("show"), ms);
}

function showCelebrate(text = "Richtig", ms = 800) {
  clearTimeout(_celebrateTimer);
  el.celebrateText.textContent = text;
  el.celebrate.classList.add("show");
  _celebrateTimer = setTimeout(() => el.celebrate.classList.remove("show"), ms);
}

function showOops(text = "Nicht richtig", ms = 800) {
  clearTimeout(_oopsTimer);
  el.oopsText.textContent = text;
  el.oops.classList.add("show");
  _oopsTimer = setTimeout(() => el.oops.classList.remove("show"), ms);
}

function setFips(mood = "idle", line = "") {
  const src = ASSETS.fips?.[mood] || ASSETS.fips?.idle || "";
  if (el.fipsMainImg) el.fipsMainImg.src = src;
  if (el.fipsAvatar) el.fipsAvatar.src = src;
  if (el.fipsGiantImg) el.fipsGiantImg.src = ASSETS.fips?.excited || src;
  if (el.oopsFipsImg) el.oopsFipsImg.src = ASSETS.fips?.sad || src;

  if (el.fipsMainLine) el.fipsMainLine.textContent = line || "";
  if (el.fipsLine) el.fipsLine.textContent = line || "";
}

function renderDots(total, activeIndex, doneArr = []) {
  if (!el.dots) return;
  el.dots.innerHTML = "";
  for (let i = 0; i < total; i++) {
    const d = document.createElement("div");
    d.className = "d" + (i === activeIndex || doneArr[i] ? " on" : "");
    el.dots.appendChild(d);
  }
}

function pulse(node) {
  if (!node) return;
  node.classList.remove("pulse");
  void node.offsetHeight;
  node.classList.add("pulse");
}

// ------------------------------------------------------------
// Persistence
// ------------------------------------------------------------
function save() {
  try {
    if (State.saveState) State.saveState(state);
  } catch {}
}

// ------------------------------------------------------------
// Progression
// ------------------------------------------------------------
function gainXP(amount) {
  state.xp += amount;

  while (state.xp >= state.xpNeed) {
    state.xp -= state.xpNeed;
    state.level += 1;
    state.xpNeed = Math.round(state.xpNeed * 1.18 + 10);
    showToast(`Level Up! Stufe ${state.level} erreicht.`, 1800);
    setFips("excited", `Stufe ${state.level}. Weiter.`);
  }

  pulse(el.pillXP);
}

function loseHeart() {
  state.hearts = clamp(state.hearts - 1, 0, state.heartsMax);
  pulse(el.pillHearts);
  vibrate(60);

  if (state.hearts === 0) {
    showToast("Keine Herzen mehr. Szene startet neu.", 2200);

    const i = state.nodeIndex;
    const s = state.scene[i];

    s.tries = 0;
    s.answered = false;
    s.perfect = true;
    s.collected = {};
    s.sparkFound = false;

    s.qIndex = 0;
    s.correctSteps = [false, false, false];
    s.xpGrantedSteps = [false, false, false];

    if (NODES[i].boss) {
      s.bossHP = NODES[i].boss.hpMax;
      s.bossStep = 0;
      s.bossXpGrantedSteps = Array((NODES[i].readBoss || []).length || 9).fill(false);
    }

    state.hearts = state.heartsMax;
    state.streak = 0;

    setFips("sad", "Nochmal.");
    vibrate(140);
  }
}

async function setSceneImage(nodeKey) {
  const candidates = (ASSETS.scenes && ASSETS.scenes[nodeKey]) || [];
  el.sceneFallback.classList.remove("show");
  el.sceneImg.style.display = "block";

  const tryLoad = (src) =>
    new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ ok: true, src });
      img.onerror = () => resolve({ ok: false, src });
      img.src = src;
    });

  for (const src of candidates) {
    const r = await tryLoad(src);
    if (r.ok) {
      el.sceneImg.src = r.src;
      return true;
    }
  }

  el.sceneImg.removeAttribute("src");
  el.sceneImg.style.display = "none";
  el.sceneFallback.classList.add("show");
  showToast("Szene-Bild fehlt. Dateiname/Pfad prüfen.", 2600);
  return false;
}

// ------------------------------------------------------------
// Render
// ------------------------------------------------------------
function renderHUD() {
  el.starsVal.textContent = state.stars;
  el.applesVal.textContent = state.apples;
  el.lanternsVal.textContent = state.lanterns;
  el.sparksVal.textContent = state.sparks;

  el.streakVal.textContent = state.streak;
  el.levelVal.textContent = state.level;
  el.focusVal.textContent = state.focus;

  el.xpVal.textContent = state.xp;
  el.xpNeed.textContent = state.xpNeed;

  const pct = clamp((state.xp / state.xpNeed) * 100, 0, 100);
  el.xpBar.style.width = pct.toFixed(1) + "%";

  // Herzen NICHT neu bauen (sonst verschwinden sie wieder je nach CSS).
  // Wir bauen sie neu, aber mit CSS-Klasse .heart, die jetzt in ui.css existiert.
  el.hearts.innerHTML = "";
  for (let i = 0; i < state.heartsMax; i++) {
    const img = document.createElement("img");
    img.src = ASSETS.icons.herz;
    img.alt = "Herz";
    img.className = "heart" + (i < state.hearts ? "" : " off");
    el.hearts.appendChild(img);
  }
}

function renderPath() {
  el.pathList.innerHTML = "";
  const done = state.completed.filter(Boolean).length;
  el.chapterStatus.textContent = `${done}/${NODES.length} erledigt`;

  NODES.forEach((n, i) => {
    const unlocked = state.unlocked[i];
    const completed = state.completed[i];

    const btn = document.createElement("div");
    btn.className =
      "node" +
      (unlocked ? "" : " locked") +
      (i === state.nodeIndex ? " active" : "");

    const extra = completed ? "erledigt" : unlocked ? "bereit" : "gesperrt";
    btn.innerHTML = `
      <div class="left">
        <div class="badge">${i + 1}</div>
        <div>
          <div style="font-weight:1000; line-height:1.05;">${n.title}</div>
          <div class="tiny" style="margin-top:2px;">${extra}</div>
        </div>
      </div>
      <div class="tiny">${completed ? "✓" : unlocked ? "→" : "🔒"}</div>
    `;

    btn.addEventListener("click", () => {
      if (!state.unlocked[i]) return;
      state.nodeIndex = i;
      save();
      renderAll();
    });

    el.pathList.appendChild(btn);
  });
}

function markCompleted(i) {
  state.completed[i] = true;
  state.scene[i].answered = true;

  gainXP(30);
  state.streak += 1;

  if (i < NODES.length - 1) state.unlocked[i + 1] = true;
}

function renderAnswers(shuffled) {
  el.answers.innerHTML = "";
  shuffled.forEach((wrap) => {
    const div = document.createElement("div");
    div.className = "ans";
    div.textContent = wrap.a.t;
    div.addEventListener("click", () => onAnswer(wrap.a, div));
    el.answers.appendChild(div);
  });

  const i = state.nodeIndex;
  const ok = state.completed[i] ? "erledigt" : "offen";
  el.statusLine.innerHTML = `Status: <span class="tiny">${ok}</span>`;
}

function onInteract(it, hsEl, cx, cy) {
  const i = state.nodeIndex;
  const s = state.scene[i];
  if (state.completed[i]) return;

  // Sammeln ist Bonus
  if (it.once) s.collected[it.id] = true;
  burstAtHotspot(hsEl);

  if (it.type === "collect_star") {
    state.stars += it.points || 1;
    pulse(el.pillStars);
    gainXP(3);
    setFips("happy", "Bonus: Stern.");
    flyToHUD(cx, cy, ASSETS.icons.stern, el.pillStars);
    showToast("Bonus", 1200);
  } else if (it.type === "collect_apple") {
    state.apples += it.points || 1;
    pulse(el.pillApples);
    gainXP(2);
    setFips("happy", "Bonus: Apfel.");
    flyToHUD(cx, cy, ASSETS.interact.Apfel, el.pillApples);
    showToast("Bonus", 1200);
  } else if (it.type === "collect_lantern") {
    state.lanterns += it.points || 1;
    pulse(el.pillLanterns);
    gainXP(2);
    setFips("happy", "Bonus: Laterne.");
    flyToHUD(cx, cy, ASSETS.interact.Laterne, el.pillLanterns);
    showToast("Bonus", 1200);
  }

  save();
  renderHUD();
  renderAll();
}

function autoAdvanceIfPossible() {
  const i = state.nodeIndex;
  if (i < NODES.length - 1 && state.unlocked[i + 1]) {
    setTimeout(() => {
      state.nodeIndex = i + 1;
      save();
      renderAll();
    }, 650);
  }
}

function onAnswer(chosen, btnEl) {
  const i = state.nodeIndex;
  const node = NODES[i];
  const s = state.scene[i];

  if (state.completed[i]) return;

  const cards = [...el.answers.querySelectorAll(".ans")];
  cards.forEach((c) => c.classList.remove("correct", "wrong"));

  s.tries += 1;

  if (chosen && chosen.correct) {
    btnEl.classList.add("correct");
    showCelebrate("Richtig");
    setFips("excited", "Richtig.");
    vibrate(45);

    if (node.boss) {
      const total = (node.readBoss || []).length || 9;
      const step = clamp(s.bossStep, 0, total - 1);

      if (!s.bossXpGrantedSteps[step]) {
        s.bossXpGrantedSteps[step] = true;
        gainXP(14);
      }

      if (s.bossHP > 0) {
        s.bossHP = clamp(s.bossHP - 1, 0, node.boss.hpMax);
        bossHitFX(el);
      }

      s.bossStep = clamp(s.bossStep + 1, 0, total - 1);

      if (s.bossHP === 0) {
        el.statusLine.innerHTML = `Status: <span class="good">Boss besiegt.</span>`;
        gainXP(40);
        markCompleted(i);
        el.gateOpen.classList.add("show");
        setTimeout(() => el.gateOpen.classList.remove("show"), 1200);

        autoAdvanceIfPossible();
      } else {
        el.statusLine.innerHTML = `Status: <span class="good">Treffer.</span>`;
      }
    } else {
      const total = (node.readSteps || []).length || 3;
      const qi = clamp(s.qIndex, 0, total - 1);

      if (!s.correctSteps[qi]) s.correctSteps[qi] = true;

      if (!s.xpGrantedSteps[qi]) {
        s.xpGrantedSteps[qi] = true;
        gainXP(16);
      }

      if (qi < total - 1) {
        s.qIndex = qi + 1;
        el.statusLine.innerHTML = `Status: <span class="good">Richtig.</span>`;
      } else {
        el.statusLine.innerHTML = `Status: <span class="good">Erledigt.</span>`;
        markCompleted(i);

        // Nach 3/3 richtig automatisch weiter
        autoAdvanceIfPossible();
      }
    }

    save();
    renderAll();
  } else {
    btnEl.classList.add("wrong");
    s.perfect = false;
    state.streak = 0;

    showOops("Nicht richtig");
    showToast("Falsch.", 1200);

    loseHeart();
    el.statusLine.innerHTML = `Status: <span class="bad">Falsch.</span>`;
    setFips("thinking", "Nochmal.");

    save();
    renderAll();
  }
}

async function renderScene() {
  const i = state.nodeIndex;
  const node = NODES[i];
  const s = state.scene[i];

  el.sceneTitle.textContent = node.title;
  el.overlay.innerHTML = "";
  el.gateOpen.classList.remove("show");

  await setSceneImage(node.key);
  renderBossUI(el, node, s);

  let pack, qLabel, answers, seedKey;

  if (node.boss) {
    const total = (node.readBoss || []).length || 9;
    const step = clamp(s.bossStep, 0, total - 1);

    pack = node.readBoss[step];
    qLabel = `Bossfrage ${step + 1}/${total}`;

    seedKey = `${node.id}|boss|${step}|${s.tries}`;
    answers = shuffledAnswersWithKey(pack.answers, seedKey);

    const progressArr = Array(total).fill(false).map((_, idx) => idx < step);
    renderDots(total, step, progressArr);
  } else {
    const total = (node.readSteps || []).length || 3;
    const qi = clamp(s.qIndex, 0, total - 1);

    pack = node.readSteps[qi];
    qLabel = `Frage ${qi + 1}/${total}`;

    seedKey = `${node.id}|q|${qi}|${s.tries}`;
    answers = shuffledAnswersWithKey(pack.answers, seedKey);

    renderDots(total, qi, s.correctSteps);
  }

  el.readText.innerHTML = pack.text;
  el.question.textContent = pack.question;
  el.qProgress.textContent = qLabel;

  renderAnswers(answers);

  // Next nur als Backup, Auto-Advance macht das eigentliche Weiter
  el.nextBtn.disabled = !(state.completed[i] && i < NODES.length - 1 && state.unlocked[i + 1]);

  // Interactables
  (node.interactables || []).forEach((it) => {
    if (it.once && s.collected[it.id]) return;

    let x = it.x;
    let y = it.y;
    if (y > 74) y = 72;

    const hs = document.createElement("div");
    hs.className = "hotspot";
    hs.style.left = x + "%";
    hs.style.top = y + "%";
    hs.style.setProperty("--w", (it.w || 120) + "px");
    hs.title = it.label || "Tippen";

    const img = document.createElement("img");
    img.src = it.img;
    img.alt = it.label || "Tippen";
    hs.appendChild(img);

    hs.addEventListener("click", (e) => {
      e.stopPropagation();
      onInteract(it, hs, e.clientX, e.clientY);
    });

    el.overlay.appendChild(hs);
  });

  // Geheimfunke
  const sp = node.sparkHotspot;
  if (sp && !s.sparkFound) {
    const hs = document.createElement("div");
    hs.className = "hotspot";
    hs.style.left = sp.x + "%";
    hs.style.top = (sp.y > 74 ? 72 : sp.y) + "%";
    hs.style.width = sp.r * 2 + "%";
    hs.style.height = sp.r * 2 + "%";
    hs.style.borderRadius = "999px";
    hs.style.opacity = "0.001";
    hs.addEventListener("click", (e) => {
      e.stopPropagation();
      s.sparkFound = true;
      state.sparks += 1;
      pulse(el.pillSparks);
      gainXP(10);
      showToast("Geheimfunke!", 1600);
      setFips("excited", "Gefunden.");
      save();
      renderAll();
    });
    el.overlay.appendChild(hs);
  }
}

function toggleDrawer(force) {
  const isOpen = el.drawer.classList.contains("open");
  const next = force !== undefined ? !!force : !isOpen;
  el.drawer.classList.toggle("open", next);
}

async function renderAll() {
  renderHUD();
  renderPath();
  await renderScene();

  const i = state.nodeIndex;
  el.nextBtn.disabled = !(state.completed[i] && i < NODES.length - 1 && state.unlocked[i + 1]);
}

// ------------------------------------------------------------
// Events
// ------------------------------------------------------------
el.reReadBtn.addEventListener("click", () => {
  showToast("Nochmal lesen.", 1200);
  setFips("thinking", "Lies. Dann antworte.");
});

el.nextBtn.addEventListener("click", () => {
  const i = state.nodeIndex;
  if (i < NODES.length - 1 && state.unlocked[i + 1]) {
    state.nodeIndex = i + 1;
    save();
    renderAll();
  }
});

el.resetBtn.addEventListener("click", () => {
  if (!confirm("Wirklich alles zurücksetzen?")) return;

  if (State.resetState) {
    state = State.resetState();
  } else if (State.defaultState) {
    state = State.defaultState();
    save();
  }

  renderAll();
  showToast("Reset. Alles zurückgesetzt.", 1800);
  setFips("idle", "Los geht’s. Lesen, dann antworten.");
});

el.helpBtn.addEventListener("click", () => {
  showToast("So geht’s: Lesen · Antworten · Weiter. Sammeln ist Bonus.", 5200);
  setFips("idle", "Sammeln ist Bonus.");
});

el.drawerBtn.addEventListener("click", () => toggleDrawer());
el.drawerCloseBtn.addEventListener("click", () => toggleDrawer(false));

window.addEventListener("keydown", (e) => {
  const k = e.key.toLowerCase();
  if (k === "h") el.helpBtn.click();
  if (k === "r") el.resetBtn.click();
  if (k === "escape") toggleDrawer(false);
});

// ------------------------------------------------------------
// Start
// ------------------------------------------------------------
setFips("idle", "Lies den Text. Beantworte Fragen. Sammeln ist Bonus.");
renderAll().then(() => save());
