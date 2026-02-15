// src/game/game.js
import { mountUILayout, bindElements } from "../ui/ui-layout.js";
import * as UI from "../ui/ui.js";
import * as U from "../core/utils.js";
import * as State from "../core/state.js";

import { ASSETS } from "../data/assets.js";
import { NODES } from "../data/nodes.js";

import { renderBossUI, bossHitFX } from "./boss.js";
import { burstAtHotspot, flyToHUD } from "./interactions.js";

// ------------------------------------------------------------
// Robust Fallbacks (damit keine Import-Exports mehr crashten)
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

// deterministische Shuffle-Funktion (falls utils.js die nicht exportiert)
function hash32(str) {
  // FNV-1a 32bit
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
function shuffledAnswersWithKeyFallback(answers, seedKey) {
  const seed = hash32(String(seedKey || ""));
  const rnd = mulberry32(seed);
  const arr = (answers || []).map((a, idx) => ({ a, idx }));
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  // wenn mal identische Reihenfolge vorkommt: kleiner "tick" anhand seed
  return arr;
}
const shuffledAnswersWithKey =
  U.shuffledAnswersWithKey || shuffledAnswersWithKeyFallback;

// UI-Funktionen defensiv (damit ui.js Umbenennungen nicht killen)
const toast = UI.toast || (() => {});
const pulse = UI.pulse || (() => {});
const setFips = UI.setFips || (() => {});
const renderDots = UI.renderDots || (() => {});
const showCelebrate = UI.showCelebrate || UI.celebrate || (() => {});
const showOops = UI.showOops || UI.oops || (() => {});

// ------------------------------------------------------------
// Boot
// ------------------------------------------------------------
const root = document.getElementById("app");
mountUILayout(root);
const el = bindElements();

// State kommt aus core/state.js (nicht mehr core/storage.js)
let state = (State.loadState && State.loadState()) || (State.defaultState && State.defaultState());

// Falls state.js mal noch nicht existiert/anders ist:
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
// Helpers
// ------------------------------------------------------------
function save() {
  try {
    if (State.saveState) State.saveState(state);
  } catch {}
}

function gainXP(amount) {
  state.xp += amount;
  while (state.xp >= state.xpNeed) {
    state.xp -= state.xpNeed;
    state.level += 1;
    state.xpNeed = Math.round(state.xpNeed * 1.18 + 10);
    toast(el, `<b>Level Up!</b> Stufe ${state.level} erreicht.`);
    setFips(el, ASSETS, "excited", `Stufe ${state.level}. Weiter.`);
  }
  pulse(el.pillXP);
}

function loseHeart() {
  state.hearts = clamp(state.hearts - 1, 0, state.heartsMax);
  pulse(el.pillHearts);
  vibrate(60);

  if (state.hearts === 0) {
    toast(el, `<b>Oh nein.</b> Keine Herzen mehr. Szene startet neu.`);
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

    // Kinderfreundlich: kurze, einfache Anzeige
    setFips(el, ASSETS, "sad", "Nochmal.");
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
  toast(el, "<b>Szene-Bild fehlt.</b> Dateiname/Pfad prüfen.", 2600);
  return false;
}

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
    btn.className = "node" + (unlocked ? "" : " locked") + (i === state.nodeIndex ? " active" : "");
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

  // Sammeln ist Bonus, nie Pflicht:
  if (it.once) s.collected[it.id] = true;
  burstAtHotspot(hsEl);

  if (it.type === "collect_star") {
    state.stars += it.points || 1;
    pulse(el.pillStars);
    gainXP(3);
    setFips(el, ASSETS, "happy", "Bonus: Stern.");
    flyToHUD(cx, cy, ASSETS.icons.stern, el.pillStars);
    toast(el, `<b>Bonus</b>`, 1200);
  } else if (it.type === "collect_apple") {
    state.apples += it.points || 1;
    pulse(el.pillApples);
    gainXP(2);
    setFips(el, ASSETS, "happy", "Bonus: Apfel.");
    flyToHUD(cx, cy, ASSETS.interact.Apfel, el.pillApples);
    toast(el, `<b>Bonus</b>`, 1200);
  } else if (it.type === "collect_lantern") {
    state.lanterns += it.points || 1;
    pulse(el.pillLanterns);
    gainXP(2);
    setFips(el, ASSETS, "happy", "Bonus: Laterne.");
    flyToHUD(cx, cy, ASSETS.interact.Laterne, el.pillLanterns);
    toast(el, `<b>Bonus</b>`, 1200);
  }

  save();
  renderHUD();
  renderAll();
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
    showCelebrate(el, ASSETS, "Richtig");
    setFips(el, ASSETS, "excited", "Richtig.");
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
        // Boss-Hit Animation/FX
        bossHitFX(el);
      }

      s.bossStep = clamp(s.bossStep + 1, 0, total - 1);

      if (s.bossHP === 0) {
        el.statusLine.innerHTML = `Status: <span class="good">Boss besiegt.</span>`;
        gainXP(40);
        markCompleted(i);
        el.gateOpen.classList.add("show");
        setTimeout(() => el.gateOpen.classList.remove("show"), 1200);
      } else {
        el.statusLine.innerHTML = `Status: <span class="good">Treffer.</span>`;
      }
    } else {
      const qi = clamp(s.qIndex, 0, (node.readSteps || []).length - 1);
      if (!s.correctSteps[qi]) s.correctSteps[qi] = true;

      if (!s.xpGrantedSteps[qi]) {
        s.xpGrantedSteps[qi] = true;
        gainXP(16);
      }

      if (qi < (node.readSteps || []).length - 1) {
        s.qIndex = qi + 1;
        el.statusLine.innerHTML = `Status: <span class="good">Richtig.</span>`;
      } else {
        el.statusLine.innerHTML = `Status: <span class="good">Erledigt.</span>`;
        markCompleted(i);
      }
    }

    save();
    renderAll();
  } else {
    btnEl.classList.add("wrong");
    s.perfect = false;
    state.streak = 0;

    showOops(el, ASSETS, "Nicht richtig");
    toast(el, `<b>Falsch.</b>`, 1200);

    loseHeartNotice();
    el.statusLine.innerHTML = `Status: <span class="bad">Falsch.</span>`;
    setFips(el, ASSETS, "thinking", "Nochmal.");

    save();
    renderAll();
  }
}

function loseHeartNotice() {
  // Mini-Wrapper: damit wir ggf. später Kinder-Overlay (Symbole) einbauen können
  loseHeart();
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

    // Antworten IMMER mischen, aber reproduzierbar
    seedKey = `${node.id}|boss|${step}|${s.tries}`;
    answers = shuffledAnswersWithKey(pack.answers, seedKey);

    // Dots: bereits erledigte = true
    const progressArr = Array(total)
      .fill(false)
      .map((_, idx) => idx < step);
    renderDots(el, total, step, progressArr);
  } else {
    const total = (node.readSteps || []).length || 3;
    const qi = clamp(s.qIndex, 0, total - 1);

    pack = node.readSteps[qi];
    qLabel = `Frage ${qi + 1}/${total}`;

    seedKey = `${node.id}|q|${qi}|${s.tries}`;
    answers = shuffledAnswersWithKey(pack.answers, seedKey);

    renderDots(el, total, qi, s.correctSteps);
  }

  el.readText.innerHTML = pack.text;
  el.question.textContent = pack.question;
  el.qProgress.textContent = qLabel;

  renderAnswers(answers);

  el.nextBtn.disabled = !(state.completed[i] && i < NODES.length - 1 && state.unlocked[i + 1]);

  // Interactables
  (node.interactables || []).forEach((it) => {
    if (it.once && s.collected[it.id]) return;

    let x = it.x;
    let y = it.y;
    if (y > 74) y = 72; // nicht unter UI

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
      toast(el, `<b>Geheimfunke!</b>`);
      setFips(el, ASSETS, "excited", "Gefunden.");
      save();
      renderAll();
    });
    el.overlay.appendChild(hs);
  }
}

function toggleDrawer(force) {
  const show = force !== undefined ? force : !el.drawer.classList.contains("show");
  el.drawer.classList.toggle("show", !!show);
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
  toast(el, `<b>Nochmal lesen.</b>`, 1200);
  setFips(el, ASSETS, "thinking", "Lies. Dann antworte.");
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

  // Wenn core/state.js resetState anbietet, nutze das.
  if (State.resetState) {
    state = State.resetState();
  } else if (State.defaultState) {
    state = State.defaultState();
    save();
  }

  renderAll();
  toast(el, "<b>Reset.</b> Alles zurückgesetzt.");
  setFips(el, ASSETS, "idle", "Los geht’s. Lesen, dann antworten.");
});

el.helpBtn.addEventListener("click", () => {
  toast(el, `<b>So geht’s:</b> Lesen · Antworten · Weiter. Sammeln ist Bonus.`, 5200);
  setFips(el, ASSETS, "idle", "Sammeln ist Bonus.");
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
setFips(el, ASSETS, "idle", "Lies das Pergament. Beantworte Fragen. Sammeln ist Bonus.");
renderAll().then(() => save());
