// src/game/main.js
(async () => {
  try {
    console.log("[Leselabyrinth] main.js loaded");

    // Game laden (wenn hier was knallt, zeigen wir es im Browser an)
    await import("./game.js");

  } catch (err) {
    console.error("[Leselabyrinth] Boot error:", err);

    // Sichtbarer Fehler auf der Seite (kein schwarzes Loch mehr)
    const msg = (err && (err.stack || err.message)) ? (err.stack || err.message) : String(err);

    document.body.innerHTML = `
      <div style="
        min-height:100vh; display:flex; align-items:center; justify-content:center;
        padding:24px; font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
        background: #070a14; color: #eaf0ff;">
        <div style="
          max-width: 980px; width: 100%;
          border: 1px solid rgba(255,255,255,.18);
          background: rgba(255,255,255,.06);
          border-radius: 16px;
          padding: 18px 18px 14px;">
          <div style="font-weight:900; font-size:18px; margin-bottom:10px;">
            Startfehler (Boot Error)
          </div>
          <div style="opacity:.9; margin-bottom:10px;">
            Kopiere den Fehlertext unten und sende ihn mir. Dann fixen wir exakt die Ursache.
          </div>
          <pre style="
            white-space: pre-wrap;
            background: rgba(0,0,0,.35);
            border: 1px solid rgba(255,255,255,.12);
            border-radius: 12px;
            padding: 12px;
            overflow:auto;
            max-height: 60vh;
            line-height: 1.35;
            font-size: 13px;">${escapeHtml(msg)}</pre>
        </div>
      </div>
    `;
  }

  function escapeHtml(s) {
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }
})();
