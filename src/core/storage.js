export function createDefaultState() {
  return { __key: "test", scene: [], unlocked: [], completed: [], nodeIndex: 0, heartsMax: 3, hearts: 3, stars: 0, apples: 0, lanterns: 0, sparks: 0, streak: 0, level: 1, xp: 0, xpNeed: 100, focus: "W-Frage" };
}
export function loadState(defaultState){ return defaultState; }
export function saveState(){ }
