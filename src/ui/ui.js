import { vibrate } from "../core/utils.js";

export function toast(el, html, ms = 2200) {
  el.toast.innerHTML = html;
  el.toast.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.toast.classList.remove("show"), ms);
}

export function pulse(pillEl) {
  pillEl.classList.remove("pulse");
  void pillEl.offsetWidth;
  pillEl.classList.add("pulse");
}

export function setFips(el, assets, mood, line) {
  const src = assets.fips[mood] || assets.fips.idle;
  el.fipsAvatar.src = src;
  el.fipsMainImg.src = src;
  el.fipsLine.textContent = line;
  el.fipsMainLine.textContent = line;

  el.fipsMainImg.classList.remove("wiggle");
  void el.fipsMainImg.offsetWidth;
  el.fipsMainImg.classList.add("wiggle");
}

export function renderDots(el, total, currentIndex, correctArrayOrNull) {
  el.dots.innerHTML = "";
  for (let i = 0; i < total; i++) {
    const d = document.createElement("div");
    d.className = "dot";
    if (i === currentIndex) d.classList.add("now");
    if (Array.isArray(correctArrayOrNull) && !!correctArrayOrNull[i]) d.classList.add("on");
    el.dots.appendChild(d);
  }
}

export function showCelebrate(el, assets, text) {
  el.fipsGiantImg.src = assets.fips.excited || assets.fips.happy || assets.fips.idle;
  el.celebrateText.textContent = text || "Richtig";

  el.confetti.innerHTML = "";
  const pieces = 56;
  for (let i = 0; i < pieces; i++) {
    const d = document.createElement("div");
    d.className = "c";
    d.style.left = (Math.random() * 100) + "%";
    d.style.top = (-20 - Math.random() * 120) + "px";
    d.style.animationDelay = (Math.random() * 120) + "ms";
    d.style.animationDuration = (920 + Math.random() * 520) + "ms";
    const r = 200 + Math.floor(Math.random() * 55);
    const g = 150 + Math.floor(Math.random() * 80);
    const b = 140 + Math.floor(Math.random() * 90);
    d.style.background = `rgba(${r},${g},${b},.92)`;
    el.confetti.appendChild(d);
  }

  el.celebrate.classList.add("show");
  clearTimeout(showCelebrate._t);
  showCelebrate._t = setTimeout(() => {
    el.celebrate.classList.remove("show");
    el.confetti.innerHTML = "";
  }, 980);
}

export function showOops(el, assets, text) {
  el.oopsText.textContent = text || "Nicht richtig";
  el.oopsFipsImg.src = assets.fips.sad || assets.fips.idle;
  el.oops.classList.add("show");
  vibrate(40);

  clearTimeout(showOops._t);
  showOops._t = setTimeout(() => el.oops.classList.remove("show"), 850);
}

