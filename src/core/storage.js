// src/core/storage.js
// Kleine, robuste LocalStorage-Helper (JSON)

export function loadJSON(key){
  try{
    const raw = localStorage.getItem(key);
    if(!raw) return null;
    return JSON.parse(raw);
  }catch(err){
    console.error("[storage] loadJSON failed:", err);
    return null;
  }
}

export function saveJSON(key, value){
  try{
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  }catch(err){
    console.error("[storage] saveJSON failed:", err);
    return false;
  }
}

export function removeJSON(key){
  try{
    localStorage.removeItem(key);
    return true;
  }catch(err){
    console.error("[storage] removeJSON failed:", err);
    return false;
  }
}
