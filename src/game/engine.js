import { ASSETS, BOSS_HP_MAX } from "../data/assets.js";
import { NODES } from "../data/nodes.js";
import { clamp, vibrate, seededShuffle } from "../core/utils.js";
import { saveState } from "../core/state.js";
import { toast, pulse, setFips, renderDots, setSceneImage, renderAnswers, setBossUI } from "../ui/ui.js";

export function createEngine(el, state){
  function gainXP(amount){
    state.xp += amount;
    while(state.xp >= state.xpNeed){
      state.xp -= state.xpNeed;
      state.level += 1;
      state.xpNeed = Math.round(state.xpNeed * 1.18 + 10);
      toast(el, `<b>Level Up!</b> Stufe ${state.level} erreicht.`);
      setFips(el, "excited", `Stufe ${state.level}. Weiter.`);
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
      setFips(el, "sad", "Nochmal. Lies und antworte.");
      vibrate(140);
    }
  }

  function markCompleted(i){
    state.completed[i] = true;
    state.scene[i].answered = true;

    gainXP(30);
    state.streak += 1;
    if(i < NODES.length - 1) state.unlocked[i+1] = true;
  }

  function onInteract(it){
    const i = state.nodeIndex;
    const s = state.scene[i];
    if(state.completed[i]) return;

    if(it.once) s.collected[it.id] = true;

    if(it.type === "collect_star"){
      state.stars += (it.points || 1);
      pulse(el.pillStars);
      gainXP(3);
      setFips(el, "happy", "Bonus: Stern.");
      toast(el, `<b>★</b> Bonus`, 1400);
    } else if(it.type === "collect_apple"){
      state.apples += (it.points || 1);
      pulse(el.pillApples);
      gainXP(2);
      setFips(el, "happy", "Bonus: Apfel.");
      toast(el, `<b>🍎</b> Bonus`, 1400);
    } else if(it.type === "collect_lantern"){
      state.lanterns += (it.points || 1);
      pulse(el.pillLanterns);
      gainXP(2);
      setFips(el, "happy", "Bonus: Laterne.");
      toast(el, `<b>🕯</b> Bonus`, 1400);
    }

    saveState(state);
  }

  function renderHotspots(node, s){
    el.overlay.innerHTML = "";

    node.interactables.forEach(it => {
      if(it.once && s.collected[it.id]) return;

      let x = it.x;
      let y = it.y;

      // Reservierter Bottom-Bereich: Y nicht in Pergament rutschen lassen
      if(y > 74) y = 72;

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
        onInteract(it);
        renderAll(); // damit eingesammelte Items verschwinden
      });

      el.overlay.appendChild(hs);
    });

    // Secret spark
    const sp = node.sparkHotspot;
    if(sp && !s.sparkFound){
      const hs = document.createElement("div");
      hs.className = "hotspot";
      hs.style.left = sp.x + "%";
      hs.style.top  = (sp.y > 74 ? 72 : sp.y) + "%";
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
        setFips(el, "excited", "Geheimfunke gefunden.");
        saveState(state);
        renderAll();
      });
      el.overlay.appendChild(hs);
    }
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
      setFips(el, "excited", "Richtig.");
      vibrate(45);

      if(node.boss){
        const step = clamp(s.bossStep, 0, node.readBoss.length - 1);

        if(!s.bossXpGrantedSteps[step]){
          s.bossXpGrantedSteps[step] = true;
          gainXP(14);
        }

        if(s.bossHP > 0){
          s.bossHP = clamp(s.bossHP - 1, 0, node.boss.hpMax);
        }

        s.bossStep = clamp(s.bossStep + 1, 0, node.readBoss.length - 1);

        if(s.bossHP === 0){
          el.statusLine.innerHTML = `Status: <span class="good">Boss besiegt.</span>`;
          gainXP(40);
          markCompleted(i);
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

      toast(el, `<b>Falsch.</b>`, 1400);
      loseHeart();
      el.statusLine.innerHTML = `Status: <span class="bad">Falsch.</span>`;
      setFips(el, "thinking", "Nochmal lesen.");

      saveState(state);
      renderAll();
    }
  }

  async function renderScene(){
    const i = state.nodeIndex;
    const node = NODES[i];
    const s = state.scene[i];

    el.sceneTitle.textContent = node.title;

    await setSceneImage(el, node.key, (ASSETS.scenes[node.key] || []));
    setBossUI(el, node, s);

    let pack, qLabel, answers, seedKey;

    if(node.boss){
      const step = clamp(s.bossStep, 0, node.readBoss.length - 1);
      pack = node.readBoss[step];
      qLabel = `Bossfrage ${step+1}/${node.readBoss.length}`;
      seedKey = `${node.id}|boss|${step}|${s.tries}`;
      answers = seededShuffle(pack.answers, seedKey);

      const total = node.readBoss.length;
      const progressArr = Array(total).fill(false).map((_,idx)=> idx < step);
      renderDots(el, total, step, progressArr);
    }else{
      const qi = clamp(s.qIndex, 0, node.readSteps.length - 1);
      pack = node.readSteps[qi];
      qLabel = `Frage ${qi+1}/${node.readSteps.length}`;
      seedKey = `${node.id}|q|${qi}|${s.tries}`;
      answers = seededShuffle(pack.answers, seedKey);

      renderDots(el, node.readSteps.length, qi, s.correctSteps);
    }

    el.readText.innerHTML = pack.text;
    el.question.textContent = pack.question;
    el.qProgress.textContent = qLabel;

    renderAnswers(el, answers, onAnswer);

    renderHotspots(node, s);

    el.nextBtn.disabled = !(state.completed[i] && i < NODES.length-1 && state.unlocked[i+1]);
  }

  function renderAll(){
    // HUD + scene
    return renderScene();
  }

  return { gainXP, loseHeart, renderAll };
}

