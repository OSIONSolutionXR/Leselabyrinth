import { STORAGE_KEY, BOSS_HP_MAX } from "../data/assets.js";
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
      bossXpGrantedSteps: Array(BOSS_HP_MAX).fill(false)
    }))
  };
}

export function loadState(){
  const parsed = loadJSON(STORAGE_KEY);
  const d = defaultState();
  if(!parsed) return d;

  return {
    ...d,
    ...parsed,
    scene: (parsed.scene && parsed.scene.length === NODES.length) ? parsed.scene : d.scene
  };
}

export function saveState(state){
  saveJSON(STORAGE_KEY, state);
}

export function resetState(){
  const s = defaultState();
  saveState(s);
  return s;
}

