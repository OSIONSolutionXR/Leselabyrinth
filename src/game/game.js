// src/game/game.js
import * as UI from "../ui/ui.js";
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

// deterministische Shuffle-Funktion (falls utils.js die nicht exportiert)
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
function shuffledAnswersWithKeyFallback(answers, seedKey) {
  const seed = hash32(String(seedKey || ""));
  const rnd = mulberry32(seed);
  const arr = (answers || []).map((a, idx) => ({ a, idx }));
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
const shuffledAnswersWithKey =
  U.shuffledAnswersWithKey || shuffledAnswersWithKeyFallback;

// ------------------------------------------------------------
// Boot: UI V2 initialisieren
// ------------------------------------------------------------
const root = document.getElementById("app");
const el = UI.initUI(root);

// State kommt aus core/state.js
let state =
  (State.loadState && State.loadState()) ||
  (State.defaultState && State.defaultState());

// Fallback state, wenn core/state.js anders ist
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

    UI.showToast(`Stufe ${state.level} erreicht!`, 1800);
    setFips("excited", `Stufe ${state.level}. Weiter.`);
  }

  UI.setHUD({ xp: state.xp, xpNeed: state.xpNeed, level: state.level });
}

function setFips(mood, line) {
  // Minimal: wir benutzen nur das Bild + Text im linken Panel
  if (el.fipsMainLine) el.fipsMainLine.textContent = line || "";
  if (el.fipsMainImg) {
    // Wenn du später mehr Stimmungen willst: hier map mood->asset
    // Für jetzt: gleiche Figur, du kannst im assets.js gern moods hinterlegen.
    // Wir lassen src wie er ist, außer du gibst konkrete Pfade.
  }
}

function resetScene(i) {
  const s = state.scene[i];
  s.tries = 0;
  s.answered = false;
  s.perfect = true;
  s.collected = {};
  s.sparkFound = false;

  s.qIndex = 0;
  s.correctSteps = [false, false, false];
  s.xpGrantedSteps = [false, false, false];

  const node = NODES[i];
  if (node.boss) {
    s.bossHP = node.boss.hpMax;
    s.bossStep = 0;
    s.bossXpGrantedSteps = Array((node.readBoss || []).length || 9).fill(false);
  }
}

function loseHeart() {
  state.hearts = clamp(state.hearts - 1, 0, state.heartsMax);
  UI.setHUD({ hearts: state.hearts });
  vibrate(60);

  if (state.hearts === 0) {
    UI.showToast("Keine Herzen mehr. Szene startet neu.", 2200);

    const i = state.nodeIndex;
    resetScene(i);

    state.hearts = state.heartsMax;
    state.streak = 0;

    UI.setHUD({ hearts: state.hearts, streak: state.streak });
    setFips("sad", "Nochmal.");
    vibrate(140);
  }
}

async function setSceneImage(nodeKey) {
  const candidates = (ASSETS.scenes && ASSETS.scenes[nodeKey]) || [];

  // fallback handling
  if (el.sceneFallback) el.sceneFallback.style.display = "none";
  if (el.sceneImg) el.sceneImg.style.display = "block";

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
  if (el.sceneFallback) el.sceneFallback.style.display = "grid";
  UI.showToast("Szene-Bild fehlt. Pfad prüfen.", 2600);
  return false;
}

function renderHUD() {
  UI.setHUD({
    stars: state.stars,
    apples: state.apples,
    lanterns: state.lanterns,
    sparks: state.sparks,
    streak: state.streak,
    level: state.level,
    focus: state.focus,
    xp: state.xp,
    xpNeed: state.xpNeed,
    hearts: state.hearts,
  });
}

function renderPath() {
  // nodes werden im drawer angezeigt – wir füllen pathList weiter wie vorher
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
      toggleDrawer(false);
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

  UI.setHUD({ streak: state.streak });
}

function renderAnswers(shuffled) {
  UI.setAnswers(
    shuffled.map((w) => w.a.t),
    {
      onPick: (index) => {
        const chosen = shuffled[index]?.a;
        // finde dazugehöriges Element (damit markAnswer funktioniert)
        const btnEl = el.answers?.children?.[index];
        onAnswer(chosen, index, btnEl);
      },
    }
  );

  const i = state.nodeIndex;
  UI.setStatus(state.completed[i] ? "Status: erledigt" : "Status: offen");
}

function onInteract(it, hsEl, cx, cy) {
  const i = state.nodeIndex;
  const s = state.scene[i];
  if (state.completed[i]) return;

  // Sammeln ist Bonus, nie Pflicht
  if (it.once) s.collected[it.id] = true;
  burstAtHotspot(hsEl);

  if (it.type === "collect_star") {
    state.stars += it.points || 1;
    gainXP(3);
    setFips("happy", "Bonus: Stern.");
    flyToHUD(cx, cy, ASSETS.interact.Stern, el.pillStars);
    UI.showToast("Bonus!", 1200);
  } else if (it.type === "collect_apple") {
    state.apples += it.points || 1;
    gainXP(2);
    setFips("happy", "Bonus: Apfel.");
    flyToHUD(cx, cy, ASSETS.interact.Apfel, el.pillApples);
    UI.showToast("Bonus!", 1200);
  } else if (it.type === "collect_lantern") {
    state.lanterns += it.points || 1;
    gainXP(2);
    setFips("happy", "Bonus: Laterne.");
    flyToHUD(cx, cy, ASSETS.interact.Laterne, el.pillLanterns);
    UI.showToast("Bonus!", 1200);
  }

  save();
  renderHUD();
  renderAll();
}

function onAnswer(chosen, idx, btnEl) {
  const i = state.nodeIndex;
  const node = NODES[i];
  const s = state.scene[i];

  if (state.completed[i]) return;

  s.tries += 1;

  // reset classes
  [...(el.answers?.querySelectorAll(".ans") || [])].forEach((c) =>
    c.classList.remove("correct", "wrong")
  );

  if (chosen && chosen.correct) {
    if (btnEl) btnEl.classList.add("correct");
    UI.showCelebrate("Richtig", 900);
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
        UI.setStatus("Status: Boss besiegt.");
        gainXP(40);
        markCompleted(i);

        if (el.gateOpen) {
          el.gateOpen.style.display = "grid";
          setTimeout(() => (el.gateOpen.style.display = "none"), 1200);
        }
      } else {
        UI.setStatus("Status: Treffer.");
      }
    } else {
      const total = (node.readSteps || []).length || 3;
      const qi = clamp(s.qIndex, 0, total - 1);

      s.correctSteps[qi] = true;

      if (!s.xpGrantedSteps[qi]) {
        s.xpGrantedSteps[qi] = true;
        gainXP(16);
      }

      if (qi < total - 1) {
        s.qIndex = qi + 1;
        UI.setStatus("Status: Richtig.");
      } else {
        UI.setStatus("Status: Erledigt.");
        markCompleted(i);
      }
    }

    save();
    renderAll();
  } else {
    if (btnEl) btnEl.classList.add("wrong");

    s.perfect = false;
    state.streak = 0;
    UI.setHUD({ streak: state.streak });

    UI.showOops("Nicht richtig", 900);
    UI.showToast("Falsch.", 1200);

    loseHeart();
    UI.setStatus("Status: Falsch.");
    setFips("thinking", "Nochmal.");

    save();
    renderAll();
  }
}

async function renderScene() {
  const i = state.nodeIndex;
  const node = NODES[i];
  const s = state.scene[i];

  await setSceneImage(node.key);

  // Boss UI aus boss.js weiter nutzen
  renderBossUI(el, node, s);

  // Fragepaket wählen
  let pack, total, stepOrQi, seedKey;

  if (node.boss) {
    total = (node.readBoss || []).length || 9;
    stepOrQi = clamp(s.bossStep, 0, total - 1);

    pack = node.readBoss[stepOrQi];

    seedKey = `${node.id}|boss|${stepOrQi}|${s.tries}`;
    const answers = shuffledAnswersWithKey(pack.answers, seedKey);

    UI.setReadText(pack.text);
    UI.setQuestion(pack.question);
    UI.setQuestionProgress(total, stepOrQi);
    renderAnswers(answers);

    // Boss HUD Anzeige aktualisieren
    UI.showBossHud({ name: node.boss?.name || "Boss", hp: s.bossHP, max: node.boss.hpMax });
  } else {
    total = (node.readSteps || []).length || 3;
    stepOrQi = clamp(s.qIndex, 0, total - 1);

    pack = node.readSteps[stepOrQi];

    seedKey = `${node.id}|q|${stepOrQi}|${s.tries}`;
    const answers = shuffledAnswersWithKey(pack.answers, seedKey);

    UI.setReadText(pack.text);
    UI.setQuestion(pack.question);
    UI.setQuestionProgress(total, stepOrQi);
    renderAnswers(answers);

    UI.hideBossHud();
  }

  // Next Button
  el.nextBtn.disabled = !(state.completed[i] && i < NODES.length - 1 && state.unlocked[i + 1]);

  // Overlay reset
  if (el.overlay) el.overlay.innerHTML = "";

  // Interactables (Bonus)
  (node.interactables || []).forEach((it) => {
    if (it.once && s.collected[it.id]) return;

    let x = it.x;
    let y = it.y;
    if (y > 90) y = 90;

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

  // Geheimfunke (unsichtbarer Hotspot)
  const sp = node.sparkHotspot;
  if (sp && !s.sparkFound) {
    const hs = document.createElement("div");
    hs.className = "hotspot sparkHotspot";
    hs.style.left = sp.x + "%";
    hs.style.top = (sp.y > 90 ? 90 : sp.y) + "%";
    hs.style.width = sp.r * 2 + "%";
    hs.style.height = sp.r * 2 + "%";
    hs.style.borderRadius = "999px";
    hs.style.opacity = "0.001";

    hs.addEventListener("click", (e) => {
      e.stopPropagation();
      s.sparkFound = true;
      state.sparks += 1;
      gainXP(10);
      UI.setHUD({ sparks: state.sparks });
      UI.showToast("Geheimfunke!", 1700);
      setFips("excited", "Gefunden.");
      save();
      renderAll();
    });

    el.overlay.appendChild(hs);
  }
}

function toggleDrawer(force) {
  if (!el.drawer) return;
  const isOpen = el.drawer.classList.contains("open");
  const next = force !== undefined ? !!force : !isOpen;
  el.drawer.classList.toggle("open", next);
}

async function renderAll() {
  renderHUD();
  renderPath();
  await renderScene();
}

// ------------------------------------------------------------
// Events
// ------------------------------------------------------------
el.reReadBtn.addEventListener("click", () => {
  UI.showToast("Nochmal lesen.", 1200);
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
  } else {
    // Notfall: lokaler Reset
    state.nodeIndex = 0;
    state.unlocked = NODES.map((_, idx) => idx === 0);
    state.completed = NODES.map(() => false);
    state.stars = state.apples = state.lanterns = state.sparks = 0;
    state.streak = 0;
    state.level = 1;
    state.xp = 0;
    state.xpNeed = 110;
    state.heartsMax = 3;
    state.hearts = 3;
    state.focus = "W-Frage";
    state.scene = NODES.map((n) => ({
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
    }));
    save();
  }

  renderAll();
  UI.showToast("Reset. Alles zurückgesetzt.", 1800);
  setFips("idle", "Los geht’s. Lesen, dann antworten.");
});

el.helpBtn.addEventListener("click", () => {
  UI.showToast("Lesen · Antworten · Weiter. Sammeln ist Bonus.", 5200);
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
