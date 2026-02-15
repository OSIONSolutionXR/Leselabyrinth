// src/ui/ui.js
// UI-Helfer: Toast, Pulse, Fips, Dots, Celebrate/Oops Overlays

let toastTimer = null;

export function toast(el, html, ms = 2200){
  if(!el || !el.toast) return;

  el.toast.innerHTML = html;
  el.toast.classList.add("show");

  if(toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    el.toast.classList.remove("show");
  }, ms);
}

export function pulse(domEl){
  if(!domEl) return;

  // Falls .pulse in CSS existiert: super. Falls nicht: passiert einfach nichts.
  domEl.classList.remove("pulse");
  // reflow erzwingen, damit Animation neu startet
  void domEl.offsetWidth;
  domEl.classList.add("pulse");

  // nach kurzer Zeit wieder entfernen (falls keine animationend feuert)
  setTimeout(() => domEl.classList.remove("pulse"), 260);
}

export function setFips(el, ASSETS, mood, line){
  // mood z.B. "idle" | "thinking" | "excited" | "happy" | "sad"
  if(!el) return;

  if(el.fipsMainImg){
    const map = {
      idle: ASSETS?.chars?.fips?.idle || "assets/chars/fips/idle.png",
      thinking: ASSETS?.chars?.fips?.thinking || "assets/chars/fips/thinking.png",
      excited: ASSETS?.chars?.fips?.excited || "assets/chars/fips/excited.png",
      happy: ASSETS?.chars?.fips?.happy || "assets/chars/fips/happy.png",
      sad: ASSETS?.chars?.fips?.sad || "assets/chars/fips/sad.png",
    };

    el.fipsMainImg.src = map[mood] || map.idle;
  }

  if(el.fipsMainLine){
    el.fipsMainLine.textContent = line || "";
  }
}

export function renderDots(el, total, nowIndex, progressArr = []){
  if(!el || !el.dots) return;

  el.dots.innerHTML = "";
  for(let i = 0; i < total; i++){
    const d = document.createElement("div");
    d.className = "dot";
    if(progressArr[i]) d.classList.add("on");
    if(i === nowIndex) d.classList.add("now");
    el.dots.appendChild(d);
  }
}

// --------------------- Celebrate / Oops ---------------------

function ensureOverlay(type){
  // type: "celebrate" | "oops"
  let box = document.querySelector(`.${type}`);
  if(box) return box;

  box = document.createElement("div");
  box.className = type;

  const inner = document.createElement("div");
  inner.style.cssText = `
    padding: 18px 20px;
    border-radius: 18px;
    background: rgba(10,12,28,.78);
    border: 1px solid rgba(255,255,255,.14);
    backdrop-filter: blur(10px);
    box-shadow: 0 18px 40px rgba(0,0,0,.55);
    font-weight: 1000;
    color: rgba(255,255,255,.92);
    text-align: center;
    max-width: 80vw;
  `;
  inner.innerHTML = "—";

  box.appendChild(inner);
  document.body.appendChild(box);
  return box;
}

export function showCelebrate(el, ASSETS, text = "Richtig"){
  const ov = ensureOverlay("celebrate");
  const inner = ov.firstChild;
  if(inner) inner.textContent = text;

  ov.classList.add("show");
  setTimeout(() => ov.classList.remove("show"), 650);
}

export function showOops(el, ASSETS, text = "Nicht richtig"){
  const ov = ensureOverlay("oops");
  const inner = ov.firstChild;
  if(inner) inner.textContent = text;

  ov.classList.add("show");
  setTimeout(() => ov.classList.remove("show"), 650);
}
