import { clamp, vibrate } from "../core/utils.js";

export function renderBossUI(el, node, sceneState) {
  if (node.boss) {
    el.bossHud.classList.add("show");
    el.bossName.textContent = node.boss.name;
    const hpMax = node.boss.hpMax;
    const hp = clamp(sceneState.bossHP, 0, hpMax);
    el.bossHPText.textContent = hp;
    el.bossBarFill.style.width = ((hp / hpMax) * 100) + "%";
  } else {
    el.bossHud.classList.remove("show");
  }
}

export function bossHitFX(el) {
  el.bossHud.classList.add("hit", "bossShake");
  el.dmg.textContent = `-1`;
  el.dmg.classList.remove("show");
  void el.dmg.offsetWidth;
  el.dmg.classList.add("show");
  vibrate(50);

  setTimeout(() => el.bossHud.classList.remove("hit"), 380);
  setTimeout(() => el.bossHud.classList.remove("bossShake"), 260);
}

