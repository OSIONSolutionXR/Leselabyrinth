// src/ui/ui.js

let toastTimer = null;

export function toast(el, html, ms = 2200){
  if(!el || !el.toast) return;
  el.toast.innerHTML = html;
  el.toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.toast.classList.remove("show"), ms);
}

export function pulse(dom){
  if(!dom) return;
  dom.classList.remove("pulse");
  // reflow, damit die Animation sicher neu startet
  void dom.offsetWidth;
  dom.classList.add("pulse");
  setTimeout(() => dom.classList.remove("pulse"), 260);
}

export function setFips(el, ASSETS, mood = "idle", line = ""){
  if(!el) return;
  if(el.fipsMainImg){
    const map = {
      idle: ASSETS?.fips?.idle || "assets/chars/fips/idle.png",
      happy: ASSETS?.fips?.happy || "assets/chars/fips/happy.png",
      excited: ASSETS?.fips?.excited || "assets/chars/fips/excited.png",
      sad: ASSETS?.fips?.sad || "assets/chars/fips/sad.png",
      thinking: ASSETS?.fips?.thinking || "assets/chars/fips/thinking.png",
    };
    el.fipsMainImg.src = map[mood] || map.idle;
  }
  if(el.fipsMainLine) el.fipsMainLine.textContent = line || "";
}

export function renderDots(el, total, nowIndex, correctSteps = []){
  if(!el || !el.dots) return;
  el.dots.innerHTML = "";
  for(let i=0;i<total;i++){
    const d = document.createElement("div");
    d.className = "dot";
    if(correctSteps[i]) d.classList.add("on");
    if(i === nowIndex) d.classList.add("now");
    el.dots.appendChild(d);
  }
}

/**
 * Diese beiden Funktionen werden in game.js importiert.
 * Falls du keine Overlays eingebaut hast, sind sie absichtlich "safe no-op".
 */
export function showCelebrate(el, ASSETS, text = "Richtig"){
  // optional: wenn du später ein Celebrate-Layer im Layout hast:
  if(el?.celebrate){
    el.celebrate.classList.add("show");
    if(el.celebrateText) el.celebrateText.textContent = text;
    setTimeout(() => el.celebrate.classList.remove("show"), 650);
  }
}

export function showOops(el, ASSETS, text = "Nicht richtig"){
  if(el?.oops){
    el.oops.classList.add("show");
    if(el.oopsText) el.oopsText.textContent = text;
    setTimeout(() => el.oops.classList.remove("show"), 650);
  }
}
