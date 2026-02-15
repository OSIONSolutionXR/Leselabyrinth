import { mountUILayout, bindElements } from "../ui/ui-layout.js";
import { toast, pulse, setFips, renderDots, showCelebrate, showOops } from "../ui/ui.js";
import { clamp, shuffledAnswersWithKey, vibrate } from "../core/utils.js";
import { createDefaultState, loadState, saveState } from "../core/storage.js";
import { ASSETS, STORAGE_KEY, BOSS_HP_MAX } from "../data/assets.js";
import { NODES } from "../data/nodes.js";
import { renderBossUI, bossHitFX } from "./boss.js";
import { burstAtHotspot, flyToHUD } from "./interactions.js";

/* ========================
   INIT
======================== */

const root = document.getElementById("app");
mountUILayout(root);
const el = bindElements();

let state = loadState(
  createDefaultState({ NODES, BOSS_HP_MAX, STORAGE_KEY })
);

/* ========================
   CORE SYSTEM
======================== */

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
      s.bossXpGrantedSteps = Array(BOSS_HP_MAX).fill(false);
    }

    state.hearts = state.heartsMax;
    state.streak = 0;

    setFips(el, ASSETS, "sad", "Nochmal. Lies und antworte.");
    vibrate(140);
  }
}

/* ========================
   SCENE IMAGE LOADING
======================== */

async function setSceneImage(nodeKey) {
  const candidates = ASSETS.scenes[nodeKey] || [];

  el.sceneFallback.classList.remove("show");
  el.sceneImg.style.display = "block";

  for (const src of candidates) {
    const img = new Image();
    const loaded = await new Promise((res) => {
      img.onload = () => res(true);
      img.onerror = () => res(false);
      img.src = src;
    });

    if (loaded) {
      el.sceneImg.src = src;
      return true;
    }
  }

  el.sceneImg.removeAttribute("src");
  el.sceneImg.style.display = "none";
  el.sceneFallback.classList.add("show");

  toast(el, "<b>Szene-Bild fehlt.</b> Dateiname/Pfad prüfen.", 2600);
  return false;
}

/* ========================
   HUD RENDER
======================== */

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
  el.xpBar.style.width = pct + "%";

  el.hearts.innerHTML = "";

  for (let i = 0; i < state.heartsMax; i++) {
    const img = document.createElement("img");
    img.src = ASSETS.icons.herz;
    img.className = "heart" + (i < state.hearts ? "" : " off");
    el.hearts.appendChild(img);
  }
}

/* ========================
   COMPLETION LOGIC
======================== */

function markCompleted(i) {
  state.completed[i] = true;
  state.scene[i].answered = true;

  gainXP(30);
  state.streak += 1;

  if (i < NODES.length - 1) {
    state.unlocked[i + 1] = true;
  }
}

/* ========================
   RENDER MAIN SCENE
======================== */

async function renderScene() {
  const i = state.nodeIndex;
  const node = NODES[i];
  const s = state.scene[i];

  el.sceneTitle.textContent = node.title;
  el.overlay.innerHTML = "";

  await setSceneImage(node.key);
  renderBossUI(el, node, s);

  let pack;
  let answers;
  let seedKey;

  if (node.boss) {
    const step = clamp(s.bossStep, 0, node.readBoss.length - 1);
    pack = node.readBoss[step];
    seedKey = `${node.id}|boss|${step}|${s.tries}`;
    answers = shuffledAnswersWithKey(pack.answers, seedKey);

    renderDots(el, node.readBoss.length, step, []);
  } else {
    const qi = clamp(s.qIndex, 0, node.readSteps.length - 1);
    pack = node.readSteps[qi];
    seedKey = `${node.id}|q|${qi}|${s.tries}`;
    answers = shuffledAnswersWithKey(pack.answers, seedKey);

    renderDots(el, node.readSteps.length, qi, s.correctSteps);
  }

  el.readText.innerHTML = pack.text;
  el.question.textContent = pack.question;
  el.qProgress.textContent = "Frage";

  renderAnswers(answers);
}

/* ========================
   ANSWERS
======================== */

function renderAnswers(shuffled) {
  el.answers.innerHTML = "";

  shuffled.forEach((wrap) => {
    const div = document.createElement("div");
    div.className = "ans";
    div.textContent = wrap.a.t;
    div.addEventListener("click", () => onAnswer(wrap.a, div));
    el.answers.appendChild(div);
  });
}

/* ========================
   ANSWER CLICK
======================== */

function onAnswer(chosen, btnEl) {
  const i = state.nodeIndex;
  const s = state.scene[i];

  if (state.completed[i]) return;

  const cards = [...el.answers.querySelectorAll(".ans")];
  cards.forEach((c) => c.classList.remove("correct", "wrong"));

  s.tries += 1;

  if (chosen && chosen.correct) {
    btnEl.classList.add("correct");
    showCelebrate(el, ASSETS, "Richtig");

    gainXP(16);
    markCompleted(i);

    setFips(el, ASSETS, "excited", "Richtig.");
  } else {
    btnEl.classList.add("wrong");
    showOops(el, ASSETS, "Nicht richtig");

    state.streak = 0;
    loseHeart();

    setFips(el, ASSETS, "thinking", "Nochmal lesen.");
  }

  saveState(state);
  renderAll();
}

/* ========================
   MAIN RENDER
======================== */

async function renderAll() {
  renderHUD();
  await renderScene();
}

/* ========================
   EVENTS
======================== */

el.resetBtn.addEventListener("click", () => {
  if (!confirm("Wirklich alles zurücksetzen?")) return;

  state = createDefaultState({
    NODES,
    BOSS_HP_MAX,
    STORAGE_KEY,
  });

  saveState(state);
  renderAll();
});

el.helpBtn.addEventListener("click", () => {
  toast(
    el,
    `<b>So geht’s:</b> Lesen · Antworten · Weiter. Sammeln ist Bonus.`,
    5200
  );
});

setFips(
  el,
  ASSETS,
  "idle",
  "Lies das Pergament. Beantworte Fragen. Sammeln ist Bonus."
);

renderAll().then(() => saveState(state));
