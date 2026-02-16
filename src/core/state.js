// src/core/state.js
import { STORAGE_KEY } from "../data/assets.js";
import { NODES } from "../data/nodes.js";
import { loadJSON, saveJSON } from "./storage.js";

export function defaultState(){
  return {
    nodeIndex: 0,
    unlocked: [true, false, false, false, false],
    completed: [false, false, false, false, false],

    stars: 0, apples: 0, lanterns: 0, sparks: 0,

    streak: 0,
    level: 1,
    xp: 0,
    xpNeed: 110,

    heartsMax: 3,
    hearts: 3,

    focus: "W-Frage",

    scene: NODES.map(n => ({
      tries: 0,
      answered: false,
      perfect: true,
      sparkFound: false,
      collected: {},

      qIndex: 0,
      correctSteps: [false,false,false],
      xpGrantedSteps: [false,false,false],

      bossHP: n.boss ? n.boss.hpMax : 0,
      bossStep: 0,
      bossXpGrantedSteps: Array((n.readBoss && n.readBoss.length) ? n.readBoss.length : 0).fill(false)
    }))
  };
}

export function loadState(){
  const parsed = loadJSON(STORAGE_KEY);
  const d = defaultState();
  if(!parsed) return d;

  // defensive merge
  const merged = {
    ...d,
    ...parsed,
    scene: (parsed.scene && parsed.scene.length === NODES.length) ? parsed.scene : d.scene
  };

  // sicherstellen, dass bossXpGrantedSteps passt (falls Nodes geändert wurden)
  merged.scene = merged.scene.map((s, idx) => {
    const n = NODES[idx];
    const need = (n.readBoss && n.readBoss.length) ? n.readBoss.length : 0;
    const arr = Array.isArray(s.bossXpGrantedSteps) ? s.bossXpGrantedSteps.slice(0, need) : [];
    while(arr.length < need) arr.push(false);
    return { ...s, bossXpGrantedSteps: arr, bossHP: n.boss ? Math.min(s.bossHP ?? n.boss.hpMax, n.boss.hpMax) : 0 };
  });

  return merged;
}

export function saveState(state){
  saveJSON(STORAGE_KEY, state);
}

export function resetState(){
  const s = defaultState();
  saveState(s);
  return s;
}
