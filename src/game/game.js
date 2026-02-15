// src/game/game.js

import { mountUILayout, bindElements } from "../ui/ui-layout.js";
import { toast, pulse, setFips, renderDots, showCelebrate, showOops } from "../ui/ui.js";
import { clamp, shuffledAnswersWithKey, vibrate } from "../core/utils.js";

// ✅ WICHTIG: State kommt aus core/state.js (nicht mehr core/storage.js)
import { loadState, saveState, resetState } from "../core/state.js";

import { ASSETS, BOSS_HP_MAX } from "../data/assets.js";
import { NODES } from "../data/nodes.js";
import { renderBossUI, bossHitFX } from "./boss.js";
import { burstAtHotspot, flyToHUD } from "./interactions.js";

const root = document.getElementById("app");
mountUILayout(root);
const el = bindElements();

// ✅ State ohne createDefaultState laden (kommt intern aus state.js)
let state = loadState();

function gainXP(amount){
  state.xp += amount;
  while(state.xp >= state.xpNeed){
    state.xp -= state.xpNeed;
    state.level += 1;
    state.xpNeed = Math.round(state.xpNeed * 1.18 + 10);
    toast(el, `<b>Level Up!</b> Stufe ${state.level} erreicht.`);
    setFips(el, ASSETS, "excited", `Stufe ${state.level}. Weiter.`);
  }
  pulse(el.pillXP);
}

function loseHeart(){
  state.hearts = clamp(state.hearts - 1, 0, state.heartsMax);
  pulse(el.pillHearts);
  vibrate(60);

  if(state.hearts === 0){
    toast(el, `<b>Oh nein.</b> Keine Herzen mehr. Szene startet neu.`);
    const i = state.nodeIndex;
    const s = state.scene[i];

    s.tries = 0;
    s.answered = false;
    s.perfect = true;
    s.collected = {};
    s.sparkFound = false;

    s.qIndex = 0;
    s.correctSteps = [false,false,false];
    s.xpGrantedSteps = [false,false,false];

    if(NODES[i].boss){
      s.bossHP = NODES[i].boss.hpMax;
      s.bossStep = 0;
      s.bossXpGrantedSteps = Array(BOSS_HP_MAX).fill(false);
    }

    state.hearts = state.heartsMax;
    state.streak = 0;
    setFips(el, ASSETS, "sad", "Nochmal. Lies und antworte.");
    vibrate(140);
  }
}

async function setSceneImage(nodeKey){
  const candidates = ASSETS.scenes[nodeKey] || [];
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
  toast(el, "<b>Szene-Bild fehlt.</b> Dateiname/Pfad prüfen.", 2600);
  return false;
}

function renderHUD(){
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

  el.hearts.innerHTML = "";
  for(let i=0;i<state.heartsMax;i++){
    const img = document.createElement("img");
    img.src = ASSETS.icons.herz;
    img.alt = "Herz";
    img.className = "heart" + (i < state.hearts ? "" : " off");
    el.hearts.appendChild(img);
  }
}

function renderPath(){
  el.pathList.innerHTML = "";
  const done = state.completed.filter(Boolean).length;
  el.chapterStatus.textContent = `${done}/5 erledigt`;

  NODES.forEach((n, i) => {
    const unlocked = state.unlocked[i];
    const completed = state.completed[i];

    const btn = document.createElement("div");
    btn.className = "node" + (unlocked ? "" : " locked") + (i===state.nodeIndex ? " active" : "");
    const extra = completed ? "erledigt" : (unlocked ? "bereit" : "gesperrt");
    btn.innerHTML = `
      <div class="left">
        <div class="badge">${i+1}</div>
        <div>
          <div style="font-weight:1000; line-height:1.05;">${n.title}</div>
          <div class="tiny" style="margin-top:2px;">${extra}</div>
        </div>
      </div>
      <div class="tiny">${completed ? "✓" : (unlocked ? "→" : "🔒")}</div>
    `;
    btn.addEventListener("click", () => {
      if(!state.unlocked[i]) return;
      state.nodeIndex = i;
      saveState(state);
      renderAll();
    });
    el.pathList.appendChild(btn);
  });
}

function markCompleted(i){
  state.completed[i] = true;
  state.scene[i].answered = true;

  gainXP(30);
  state.streak += 1;
  if(i < NODES.length - 1) state.unlocked[i+1] = true;
}

function renderAnswers(shuffled){
  el.answers.innerHTML = "";
  shuffled.forEach((wrap) => {
    const div = document.createElement("div");
    div.className = "ans";
    div.textContent = wrap.a.t;
    div.addEventListener("click", () => onAnswer(wrap.a, div));
    el.answers.appendChild(div);
  });

  const i = state.nodeIndex;
  const ok = state.completed[i] ? "erledigt" : "offen";
  el.statusLine.innerHTML = `Status: <span class="tiny">${ok}</span>`;
}

function onInteract(it, hsEl, cx, cy){
  const i = state.nodeIndex;
  const s = state.scene[i];
  if(state.completed[i]) return;

  if(it.once) s.collected[it.id] = true;
  burstAtHotspot(hsEl);

  if(it.type === "collect_star"){
    state.stars += (it.points || 1);
    pulse(el.pillStars);
    gainXP(3);
    setFips(el, ASSETS, "happy", "Bonus: Stern.");
    flyToHUD(cx, cy, ASSETS.icons.stern, el.pillStars);
    toast(el, `<b>★</b> Bonus`, 1400);
  } else if(it.type === "collect_apple"){
    state.apples += (it.points || 1);
    pulse(el.pillApples);
    gainXP(2);
    setFips(el, ASSETS, "happy", "Bonus: Apfel.");
    flyToHUD(cx, cy, ASSETS.interact.Apfel, el.pillApples);
    toast(el, `<b>🍎</b> Bonus`, 1400);
  } else if(it.type === "collect_lantern"){
    state.lanterns += (it.points || 1);
    pulse(el.pillLanterns);
    gainXP(2);
    setFips(el, ASSETS, "happy", "Bonus: Laterne.");
    flyToHUD(cx, cy, ASSETS.interact.Laterne, el.pillLanterns);
    toast(el, `<b>🕯</b> Bonus`, 1400);
  }

  saveState(state);
  renderHUD();
  renderAll();
}

function onAnswer(chosen, btnEl){
  const i = state.nodeIndex;
  const node = NODES[i];
  const s = state.scene[i];

  if(state.completed[i]) return;

  const cards = [...el.answers.querySelectorAll(".ans")];
  cards.forEach(c => c.classList.remove("correct","wrong"));

  s.tries += 1;

  if(chosen && chosen.correct){
    btnEl.classList.add("correct");
    showCelebrate(el, ASSETS, "Richtig");
    setFips(el, ASSETS, "excited", "Richtig.");
    vibrate(45);

    if(node.boss){
      const step = clamp(s.bossStep, 0, node.readBoss.length - 1);

      if(!s.bossXpGrantedSteps[step]){
        s.bossXpGrantedSteps[step] = true;
        gainXP(14);
      }

      if(s.bossHP > 0){
        s.bossHP = clamp(s.bossHP - 1, 0, node.boss.hpMax);
        bossHitFX(el);
      }

      s.bossStep = clamp(s.bossStep + 1, 0, node.readBoss.length - 1);

      if(s.bossHP === 0){
        el.statusLine.innerHTML = `Status: <span class="good">Boss besiegt.</span>`;
        gainXP(40);
        markCompleted(i);
        el.gateOpen.classList.add("show");
        setTimeout(() => el.gateOpen.classList.remove("show"), 1200);
      }else{
        el.statusLine.innerHTML = `Status: <span class="good">Treffer.</span>`;
      }
    }else{
      const qi = clamp(s.qIndex, 0, node.readSteps.length - 1);
      if(!s.correctSteps[qi]) s.correctSteps[qi] = true;

      if(!s.xpGrantedSteps[qi]){
        s.xpGrantedSteps[qi] = true;
        gainXP(16);
      }

      if(qi < node.readSteps.length - 1){
        s.qIndex = qi + 1;
        el.statusLine.innerHTML = `Status: <span class="good">Richtig.</span>`;
      }else{
        el.statusLine.innerHTML = `Status: <span class="good">Erledigt.</span>`;
        markCompleted(i);
      }
    }

    saveState(state);
    renderAll();
  } else {
    btnEl.classList.add("wrong");
    s.perfect = false;
    state.streak = 0;

    showOops(el, ASSETS, "Nicht richtig");
    toast(el, `<b>Falsch.</b>`, 1400);

    loseHeart();
    el.statusLine.innerHTML = `Status: <span class="bad">Falsch.</span>`;
    setFips(el, ASSETS, "thinking", "Nochmal lesen.");

    saveState(state);
    renderAll();
  }
}

async function renderScene(){
  const i = state.nodeIndex;
  const node = NODES[i];
  const s = state.scene[i];

  el.sceneTitle.textContent = node.title;
  el.overlay.innerHTML = "";
  el.gateOpen.classList.remove("show");

  await setSceneImage(node.key);
  renderBossUI(el, node, s);

  let pack, qLabel, answers, seedKey;

  if(node.boss){
    const step = clamp(s.bossStep, 0, node.readBoss.length - 1);
    pack = node.readBoss[step];
    qLabel = `Bossfrage ${step+1}/${node.readBoss.length}`;
    seedKey = `${node.id}|boss|${step}|${s.tries}`;
    answers = shuffledAnswersWithKey(pack.answers, seedKey);

    const total = node.readBoss.length;
    const progressArr = Array(total).fill(false).map((_,idx)=> idx < step);
    renderDots(el, total, step, progressArr);
  }else{
    const qi = clamp(s.qIndex, 0, node.readSteps.length - 1);
    pack = node.readSteps[qi];
    qLabel = `Frage ${qi+1}/${node.readSteps.length}`;
    seedKey = `${node.id}|q|${qi}|${s.tries}`;
    answers = shuffledAnswersWithKey(pack.answers, seedKey);

    renderDots(el, node.readSteps.length, qi, s.correctSteps);
  }

  el.readText.innerHTML = pack.text;
  el.question.textContent = pack.question;
  el.qProgress.textContent = qLabel;

  renderAnswers(answers);

  el.nextBtn.disabled = !(state.completed[i] && i < NODES.length-1 && state.unlocked[i+1]);

  node.interactables.forEach(it => {
    if(it.once && s.collected[it.id]) return;

    // ✅ FIX: harte Begrenzung, damit Hotspots nie aus dem Bild rutschen
    const x = clamp(it.x, 6, 94);
    const y = clamp(it.y, 10, 88);

    const hs = document.createElement("div");
    hs.className = "hotspot";
    hs.style.left = x + "%";
    hs.style.top  = y + "%";
    hs.style.setProperty("--w", (it.w || 120) + "px");
    hs.title = it.label || "Tippen";

    const img = document.createElement("img");
    img.src = it.img;
    img.alt = it.label || "Tippen";
    hs.appendChild(img);

    hs.addEventListener("click", (e) => {
      e.stopPropagation();
      onInteract(it, hs, e.clientX, e.clientY);
    });

    el.overlay.appendChild(hs);
  });

  const sp = node.sparkHotspot;
  if(sp && !s.sparkFound){
    const hs = document.createElement("div");
    hs.className = "hotspot";
    hs.style.left = clamp(sp.x, 6, 94) + "%";
    hs.style.top  = clamp(sp.y, 10, 88) + "%";
    hs.style.width = (sp.r*2) + "%";
    hs.style.height = (sp.r*2) + "%";
    hs.style.borderRadius = "999px";
    hs.style.opacity = "0.001";
    hs.addEventListener("click", (e) => {
      e.stopPropagation();
      s.sparkFound = true;
      state.sparks += 1;
      pulse(el.pillSparks);
      gainXP(10);
      toast(el, `<b>Geheimfunke!</b>`);
      setFips(el, ASSETS, "excited", "Geheimfunke gefunden.");
      saveState(state);
      renderAll();
    });
    el.overlay.appendChild(hs);
  }
}

function toggleDrawer(force){
  const show = (force !== undefined) ? force : !el.drawer.classList.contains("show");
  el.drawer.classList.toggle("show", !!show);
}

async function renderAll(){
  renderHUD();
  renderPath();
  await renderScene();

  const i = state.nodeIndex;
  el.nextBtn.disabled = !(state.completed[i] && i < NODES.length-1 && state.unlocked[i+1]);
}

el.reReadBtn.addEventListener("click", () => {
  toast(el, `<b>Nochmal lesen.</b>`, 1600);
  setFips(el, ASSETS, "thinking", "Lies. Dann antworte.");
});

el.nextBtn.addEventListener("click", () => {
  const i = state.nodeIndex;
  if(i < NODES.length - 1 && state.unlocked[i+1]){
    state.nodeIndex = i+1;
    saveState(state);
    renderAll();
  }
});

el.resetBtn.addEventListener("click", () => {
  if(!confirm("Wirklich alles zurücksetzen?")) return;

  // ✅ Reset kommt aus state.js (setzt + speichert intern)
  state = resetState();

  renderAll();
  toast(el, "<b>Reset.</b> Alles zurückgesetzt.");
  setFips(el, ASSETS, "idle", "Los geht’s. Lesen, dann antworten.");
});

el.helpBtn.addEventListener("click", () => {
  toast(el, `<b>So geht’s:</b> Lesen · Antworten · Weiter. Sammeln ist Bonus.`, 5200);
  setFips(el, ASSETS, "idle", "Lies. Antworte. Sammeln ist Bonus.");
});

el.drawerBtn.addEventListener("click", () => toggleDrawer());
el.drawerCloseBtn.addEventListener("click", () => toggleDrawer(false));

window.addEventListener("keydown", (e) => {
  const k = e.key.toLowerCase();
  if(k === "h") el.helpBtn.click();
  if(k === "r") el.resetBtn.click();
  if(k === "escape") toggleDrawer(false);
});

setFips(el, ASSETS, "idle", "Lies das Pergament. Beantworte Fragen. Sammeln ist Bonus.");
renderAll().then(() => saveState(state));
