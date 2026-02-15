export const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

export function vibrate(ms = 40){
  try{ if(navigator.vibrate) navigator.vibrate(ms); }catch(e){}
}

export function seededShuffle(answers, seedKey){
  const arr = answers.map((a,i)=>({a, i}));
  let h = 2166136261;
  for(let i=0;i<seedKey.length;i++){
    h ^= seedKey.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  let x = h >>> 0;
  function rnd(){
    x ^= x << 13; x >>>= 0;
    x ^= x >> 17; x >>>= 0;
    x ^= x << 5;  x >>>= 0;
    return (x >>> 0) / 4294967296;
  }
  for(let i=arr.length-1;i>0;i--){
    const j = Math.floor(rnd()*(i+1));
    [arr[i],arr[j]] = [arr[j],arr[i]];
  }
  return arr;
}
