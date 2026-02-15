// src/core/storage.js
// Liefert exakt die Exporte, die game.js importiert:
// createDefaultState, loadState, saveState

export function createDefaultState({ NODES, BOSS_HP_MAX, STORAGE_KEY }) {
  const heartsMax = 3;

  const scene = NODES.map((node) => {
    const base = {
      tries: 0,
      answered: false,
      perfect: true,
      collected: {},      // { [interactableId]: true }
      sparkFound: false,

      qIndex: 0,          // aktueller Frage-Step
      correctSteps: [false, false, false],
      xpGrantedSteps: [false, false, false],
    };

    // Boss-Node Zusatzfelder
    if (node && node.boss) {
      base.bossHP = node.boss.hpMax ?? BOSS_HP_MAX;
      base.bossStep = 0;
      base.bossXpGrantedSteps = Array(BOSS_HP_MAX).fill(false);
    }

    return base;
  });

  return {
    __key: STORAGE_KEY || "leselabyrinth_v1",

    // Progress
    nodeIndex: 0,
    unlocked: NODES.map((_, i) => i === 0),
    completed: NODES.map(() => false),
    scene,

    // HUD / Stats
    heartsMax,
    hearts: heartsMax,

    stars: 0,
    apples: 0,
    lanterns: 0,
    sparks: 0,

    streak: 0,
    level: 1,
    xp: 0,
    xpNeed: 100,

    focus: "W-Frage",
  };
}

export function loadState(defaultState) {
  const key = defaultState?.__key || "leselabyrinth_v1";

  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultState;

    const parsed = JSON.parse(raw);
    // Minimal-merge: defaultState als Basis, parsed überschreibt
    const merged = deepMerge(structuredClone(defaultState), parsed);

    // Key sicher setzen
    merged.__key = key;

    return merged;
  } catch (e) {
    console.warn("[storage] loadState failed -> fallback to default", e);
    return defaultState;
  }
}

export function saveState(state) {
  const key = state?.__key || "leselabyrinth_v1";

  try {
    localStorage.setItem(key, JSON.stringify(state));
  } catch (e) {
    console.warn("[storage] saveState failed", e);
  }
}

/* ===================== helpers ===================== */

function isObject(v) {
  return v && typeof v === "object" && !Array.isArray(v);
}

function deepMerge(target, source) {
  if (!isObject(target) || !isObject(source)) return source;

  for (const k of Object.keys(source)) {
    const sv = source[k];
    const tv = target[k];

    if (Array.isArray(sv)) {
      // Arrays: source gewinnt komplett (ist hier sauberer als elementweise)
      target[k] = sv;
    } else if (isObject(sv) && isObject(tv)) {
      target[k] = deepMerge(tv, sv);
    } else {
      target[k] = sv;
    }
  }

  return target;
}
