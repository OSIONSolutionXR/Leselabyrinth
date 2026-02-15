// src/core/utils.js

export function clamp(n, min, max){
  return Math.max(min, Math.min(max, n));
}

// kleine Vibration (mobil)
export function vibrate(ms=40){
  try{
    if(navigator.vibrate) navigator.vibrate(ms);
  }catch(e){}
}

// ---- Seeded RNG / Shuffle (damit Antworten wirklich gemischt sind, aber reproduzierbar) ----

// string -> 32bit seed
function hash32(str){
  let h = 2166136261 >>> 0; // FNV-1a basis
  for(let i=0;i<str.length;i++){
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// Mulberry32 RNG
function mulberry32(seed){
  let a = seed >>> 0;
  return function(){
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seededShuffle(arr, seedStr=""){
  const a = [...arr];
  const rand = mulberry32(hash32(String(seedStr)));
  for(let i=a.length-1;i>0;i--){
    const j = Math.floor(rand() * (i+1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Erwartet answers als Array von Objekten, z.B.
 * [{ t:"Antwort", correct:false }, ...]
 * Gibt Array von { a } zurück, damit dein game.js unverändert passt.
 */
export function shuffledAnswersWithKey(answers, seedKey){
  const shuffled = seededShuffle(answers, seedKey);
  return shuffled.map(a => ({ a }));
}
