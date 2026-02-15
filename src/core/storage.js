// src/core/storage.js

// ✅ Generische JSON-Helfer (für andere Module, die loadJSON/saveJSON erwarten)
export function loadJSON(key, fallback = null){
  try{
    const raw = localStorage.getItem(key);
    if(!raw) return fallback;
    return JSON.parse(raw);
  }catch(e){
    return fallback;
  }
}

export function saveJSON(key, value){
  try{
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  }catch(e){
    return false;
  }
}

// ✅ State API (für game.js / engine.js)
export function loadState(defaultState){
  // defaultState muss ein Objekt sein
  const key = defaultState?.storageKey || defaultState?.STORAGE_KEY || defaultState?.key;

  // Wenn kein key im defaultState steckt, fallback: "leselabyrinth_state"
  const storageKey = key || "leselabyrinth_state";

  const loaded = loadJSON(storageKey, null);
  if(!loaded) return defaultState;

  // Merge: loaded überschreibt defaultState (aber defaultState liefert fehlende Felder)
  return {
    ...defaultState,
    ...loaded,
  };
}

export function saveState(state){
  const storageKey =
    state?.storageKey ||
    state?.STORAGE_KEY ||
    state?.key ||
    "leselabyrinth_state";

  return saveJSON(storageKey, state);
}

export function clearState(storageKey = "leselabyrinth_state"){
  try{
    localStorage.removeItem(storageKey);
    return true;
  }catch(e){
    return false;
  }
}
