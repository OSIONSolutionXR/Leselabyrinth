export function createDefaultState({ NODES, BOSS_HP_MAX, STORAGE_KEY }) {
  return {
    _key: STORAGE_KEY,

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
      correctSteps: [false, false, false],
      xpGrantedSteps: [false, false, false],

      bossHP: n.boss ? n.boss.hpMax : 0,
      bossStep: 0,
      bossXpGrantedSteps: Array(BOSS_HP_MAX).fill(false)
    }))
  };
}

export function loadState(defaultState) {
  try {
    const raw = localStorage.getItem(defaultState._key);
    if (!raw) return defaultState;
    const parsed = JSON.parse(raw);

    return {
      ...defaultState,
      ...parsed,
      scene: (parsed.scene && parsed.scene.length === defaultState.scene.length) ? parsed.scene : defaultState.scene
    };
  } catch {
    return defaultState;
  }
}

export function saveState(state) {
  localStorage.setItem(state._key, JSON.stringify(state));
}

