// src/core/utils.js

export function clamp(n, a, b){
  return Math.max(a, Math.min(b, n));
}

export function vibrate(ms = 40){
  try{
    if(navigator.vibrate) navigator.vibrate(ms);
  }catch(_){}
}

/**
 * Deterministischer Zufall basierend auf String-Key
 * -> gleiche Inputs = gleiche Reihenfolge (wichtig, damit Antworten nicht immer gleich sind,
 *    aber reproduzierbar pro Szene/Frage/Versuch).
 */
function hash32(str){
  let h = 2166136261; // FNV-1a
  for(let i=0;i<str.length;i++){
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed){
  return function(){
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seededShuffle(arr, seedKey = "seed"){
  const a = arr.slice();
  const rnd = mulberry32(hash32(String(seedKey)));

  for(let i=a.length-1;i>0;i--){
    const j = Math.floor(rnd() * (i+1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Erwartetes Answer-Format in deinem game.js:
 * answers: [{ t:"Text", correct:true/false }, ...]
 *
 * Rückgabeformat:
 * [{ a: <answerObj> }, ...]  (weil dein game.js wrap.a.t nutzt)
 */
export function shuffledAnswersWithKey(answers, seedKey){
  const wrapped = (answers || []).map(a => ({ a }));
  return seededShuffle(wrapped, seedKey);
}
