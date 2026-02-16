// src/game/interactions.js
export function burstAtHotspot(hsEl) {
  if (!hsEl) return;
  const b = document.createElement("div");
  b.className = "sparkBurst";
  hsEl.appendChild(b);
  setTimeout(() => b.remove(), 520);
}

export function flyToHUD(fromClientX, fromClientY, iconSrc, targetEl) {
  if (!targetEl) return;

  const rect = targetEl.getBoundingClientRect();
  const tx = rect.left + rect.width / 2;
  const ty = rect.top + rect.height / 2;

  const img = document.createElement("img");
  img.src = iconSrc;
  img.className = "fly";
  img.style.left = fromClientX + "px";
  img.style.top = fromClientY + "px";
  document.body.appendChild(img);

  img.animate(
    [
      { transform: "translate(-50%,-50%) scale(1)", opacity: 1 },
      { transform: `translate(${(tx - fromClientX)}px, ${(ty - fromClientY)}px) scale(.65)`, opacity: 0 }
    ],
    { duration: 650, easing: "ease-in", fill: "forwards" }
  );

  setTimeout(() => img.remove(), 720);
}
