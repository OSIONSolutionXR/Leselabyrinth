import { loadState, saveState, resetState } from "./core/state.js";
import { bindUI, syncTopbarHeight, renderHUD, toast, setFips } from "./ui/ui.js";
import { createEngine } from "./game/engine.js";

(() => {
  const el = bindUI();

  function doSync(){
    syncTopbarHeight();
  }
  window.addEventListener("resize", doSync);
  window.addEventListener("load", doSync);
  doSync();

  let state = loadState();

  const engine = createEngine(el, state);

  function fullRender(){
    renderHUD(el, state);
    return engine.renderAll().then(() => saveState(state));
  }

  // Buttons
  el.reReadBtn.addEventListener("click", () => {
    toast(el, `<b>Nochmal lesen.</b>`, 1600);
    setFips(el, "thinking", "Lies. Dann antworte.");
  });

  el.nextBtn.addEventListener("click", () => {
    const i = state.nodeIndex;
    if(state.completed[i] && i < 4 && state.unlocked[i+1]){
      state.nodeIndex = i + 1;
      saveState(state);
      fullRender();
    }
  });

  el.resetBtn.addEventListener("click", () => {
    if(!confirm("Wirklich alles zurücksetzen?")) return;
    state = resetState();
    toast(el, "<b>Reset.</b> Alles zurückgesetzt.");
    setFips(el, "idle", "Los geht’s. Lesen, dann antworten.");
    // Engine hält Referenz auf state -> neu erstellen
    location.reload();
  });

  el.helpBtn.addEventListener("click", () => {
    toast(el, `<b>So geht’s:</b> Lesen · Antworten · Weiter. Sammeln ist Bonus.`, 5200);
    setFips(el, "idle", "Lies. Antworte. Sammeln ist Bonus.");
  });

  window.addEventListener("keydown", (e) => {
    const k = e.key.toLowerCase();
    if(k === "h") el.helpBtn.click();
    if(k === "r") el.resetBtn.click();
  });

  setFips(el, "idle", "Lies das Pergament. Beantworte Fragen. Sammeln ist Bonus.");
  fullRender();
})();
