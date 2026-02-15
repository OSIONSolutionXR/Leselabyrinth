import { ASSETS } from "../data/assets.js";
import { clamp } from "../core/utils.js";

export function bindUI(){
  const el = {
    // pergament
    sceneTitle: document.getElementById("sceneTitle"),
    readText: document.getElementById("readText"),
    question: document.getElementById("question"),
    answers: document.getElementById("answers"),
    reReadBtn: document.getElementById("reReadBtn"),
    nextBtn: document.getElementById("nextBtn"),
    statusLine: document.getElementById("statusLine"),
    qProgress: document.getElementById("qProgress"),
    dots: document.getElementById("dots"),

    // scene
    sceneImg: document.getElementById("sceneImg"),
    sceneFallback: document.getElementById("sceneFallback"),
    overlay: document.getElementById("overlay"),

    // boss
    bossHud: document.getElementById("bossHud"),
    bossName: document.getElementById("bossName"),
    bossBarFill: document.getElementById("bossBarFill"),
    bossHPText: document.getElementById("bossHPText"),

    // fips
    fipsMainImg: document.getElementById("fipsMainImg"),
    fipsMainLine: document.getElementById("fipsMainLine"),

    // hud values
    hearts: document.getElementById("hearts"),
    starsVal: document.getElementById("starsVal"),
    applesVal: document.getElementById("applesVal"),
    lanternsVal: document.getElementById("lanternsVal"),
    sparksVal: document.getElementById("sparksVal"),
    streakVal: document.getElementById("streakVal"),
    levelVal: document.getElementById("levelVal"),
    focusVal: document.getElementById("focusVal"),
    xpVal: document.getElementById("xpVal"),
    xpNeed: document.getElementById("xpNeed"),
    xpBar: document.getElementById("xpBar"),

    // pills
    pillHearts: document.getElementById("pillHearts"),
    pillStars: document.getElementById("pillStars"),
    pillApples: document.getElementById("pillApples"),
    pillLanterns: document.getElementById("pillLanterns"),
    pillSparks: document.getElementById("pillSparks"),
    pillXP: document.getElementById("pillXP"),

    // buttons
    resetBtn: document.getElementById("resetBtn"),
    helpBtn: document.getElementById("helpBtn"),

    // toast
    toast: document.getElementById("toast"),
  };

  if(!el.sceneImg) throw new Error("UI IDs fehlen. Prüfe index.html Markup.");

  return el;
}

export function syncTopbarHeight(){
  const tb = document.getElementById("topbar");
  if(!tb) return;
  const h = Math.ceil(tb.getBoundingClientRect().height);
  document.documentElement.style.setProperty("--topbarH", h + "px");
}

export function toast(el, html, ms = 2200){
  el.toast.innerHTML = html;
  el.toast.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(()=>el.toast.classList.remove("show"), ms);
}

export function pulse(pill){
  if(!pill) return;
  pill.classList.remove("pulse");
  void pill.offsetWidth;
  pill.classList.add("pulse");
}

export function setFips(el, mood, line){
  const src = ASSETS.fips[mood] || ASSETS.fips.idle;
  el.fipsMainImg.src = src;
  el.fipsMainLine.textContent = line;
}

export function renderDots(el, total, currentIndex, correctArrayOrNull){
  el.dots.innerHTML = "";
  for(let i=0;i<total;i++){
    const d = document.createElement("div");
    d.className = "dot";
    if(i === currentIndex) d.classList.add("now");
    if(Array.isArray(correctArrayOrNull)){
      if(!!correctArrayOrNull[i]) d.classList.add("on");
    }
    el.dots.appendChild(d);
  }
}

export function renderHUD(el, state){
  el.starsVal.textContent = state.stars;
  el.applesVal.textContent = state.apples;
  el.lanternsVal.textContent = state.lanterns;
  el.sparksVal.textContent = state.sparks;
  el.streakVal.textContent = state.streak;
  el.levelVal.textContent = state.level;
  el.focusVal.textContent = state.focus;

  el.xpVal.textContent = state.xp;
  el.xpNeed.textContent = state.xpNeed;

  const pct = clamp((state.xp / state.xpNeed) * 100, 0, 100);
  el.xpBar.style.width = pct.toFixed(1) + "%";

  // hearts
  el.hearts.innerHTML = "";
  for(let i=0;i<state.heartsMax;i++){
    const img = document.createElement("img");
    img.src = ASSETS.icons.herz;
    img.alt = "Herz";
    img.className = "heart" + (i < state.hearts ? "" : " off");
    el.hearts.appendChild(img);
  }
}

export async function setSceneImage(el, nodeKey, candidates){
  el.sceneFallback.classList.remove("show");
  el.sceneImg.style.display = "block";

  const tryLoad = (src) => new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ ok:true, src });
    img.onerror = () => resolve({ ok:false, src });
    img.src = src;
  });

  for(const src of candidates){
    const r = await tryLoad(src);
    if(r.ok){
      el.sceneImg.src = r.src;
      return true;
    }
  }

  el.sceneImg.removeAttribute("src");
  el.sceneImg.style.display = "none";
  el.sceneFallback.classList.add("show");
  return false;
}

export function renderAnswers(el, shuffled, onPick){
  el.answers.innerHTML = "";
  shuffled.forEach((wrap) => {
    const div = document.createElement("div");
    div.className = "ans";
    div.textContent = wrap.a.t;
    div.addEventListener("click", () => onPick(wrap.a, div));
    el.answers.appendChild(div);
  });
}

export function setBossUI(el, node, sceneState){
  if(node.boss){
    el.bossHud.classList.add("show");
    el.bossName.textContent = node.boss.name;
    const hpMax = node.boss.hpMax;
    const hp = clamp(sceneState.bossHP, 0, hpMax);
    el.bossHPText.textContent = hp;
    el.bossBarFill.style.width = ((hp / hpMax) * 100) + "%";
  }else{
    el.bossHud.classList.remove("show");
  }
}
