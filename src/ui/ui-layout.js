/* ===========================
   Leselabyrinth – UI (stable)
   - compact top HUD (no scroll)
   - stable overlays (toast/celebrate/oops)
   - hearts same size as other icons
   =========================== */

:root{
  --bg0:#070a14;
  --bg1:#0b1030;
  --bg2:#171a3a;

  --panel: rgba(18,22,44,.62);
  --panel2: rgba(18,22,44,.42);
  --stroke: rgba(255,255,255,.12);
  --stroke2: rgba(255,255,255,.18);

  --text:#eaf0ff;
  --muted:#b9c2e8;

  --good:#45d483;
  --bad:#ff6b6b;
  --gold:#ffd36a;
  --blue:#6fd0ff;
  --pink:#ff4fa3;

  /* Compact HUD sizing */
  --hudGap: 12px;
  --hudPadX: 18px;
  --hudPadY: 10px;

  --pillH: 44px;
  --pillRadius: 999px;

  /* 🔒 One source of truth for ALL HUD icons */
  --hudIcon: 22px;   /* <- Stern/Apfel/Laterne/Funken */
  --heartIcon: 22px; /* <- Herz EXAKT GLEICH */

  --shadow: 0 18px 50px rgba(0,0,0,.45);
}

*{ box-sizing:border-box; }
html,body{ height:100%; }
body{
  margin:0;
  color:var(--text);
  background:
    radial-gradient(1200px 700px at 70% 20%, rgba(120,90,255,.16), transparent 60%),
    radial-gradient(900px 600px at 15% 10%, rgba(255,80,160,.12), transparent 55%),
    linear-gradient(180deg, var(--bg0), var(--bg1) 45%, var(--bg2));
  font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
  overflow:hidden; /* verhindert Scroll-Chaos */
}

/* Root app fills screen */
#app{
  height:100%;
  display:flex;
  flex-direction:column;
  overflow:hidden;
}

/* ===========================
   TOPBAR / HUD
   =========================== */
.topbar{
  flex:0 0 auto;
  width:100%;
  background:
    radial-gradient(900px 220px at 50% 0%, rgba(255,255,255,.06), transparent 65%),
    linear-gradient(180deg, rgba(10,14,34,.92), rgba(10,14,34,.58));
  border-bottom:1px solid rgba(255,255,255,.08);
  backdrop-filter: blur(10px);
}
.topbar-inner{
  max-width: 1320px;
  margin: 0 auto;
  padding: var(--hudPadY) var(--hudPadX);
}

/* Brand row: compact */
.brandRow{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap: var(--hudGap);
  margin-bottom: 10px;
}
.brand{
  display:flex;
  gap: 10px;
  align-items:flex-start;
  min-width: 260px;
}
.brand .dot{
  width:10px;height:10px;border-radius:50%;
  margin-top: 6px;
  background: radial-gradient(circle at 35% 30%, #fff, rgba(255,255,255,.2) 35%, transparent 60%),
              linear-gradient(135deg, var(--pink), var(--blue));
  box-shadow: 0 0 14px rgba(255,79,163,.35);
}
.brand .title{
  font-size: 20px;
  font-weight: 900;
  letter-spacing: .2px;
  line-height: 1.15;
}
.brand .sub{
  font-size: 13px;
  color: var(--muted);
  opacity: .95;
  margin-top: 2px;
}

/* HUD container: two rows, compact, wraps nicely */
.hud{
  display:flex;
  flex-direction:column;
  gap: 10px;
}
.hudTop,
.hudBottom{
  display:flex;
  align-items:center;
  justify-content:flex-end;
  gap: var(--hudGap);
  flex-wrap:wrap;
}

/* Generic pill */
.pill, .xp{
  height: var(--pillH);
  display:flex;
  align-items:center;
  gap: 10px;
  padding: 0 14px;
  border-radius: var(--pillRadius);
  background: rgba(18,22,44,.46);
  border: 1px solid var(--stroke);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.06);
  backdrop-filter: blur(8px);
}
.pill .tiny{
  font-size: 12px;
  color: var(--muted);
  opacity: .95;
  font-weight: 800;
}
.pill b{
  font-size: 14px;
  font-weight: 1000;
}
.sep{
  opacity:.55;
  font-weight: 900;
}

/* Bigger pills (icons row) but still compact */
.pillBig{
  height: var(--pillH);
  padding: 0 14px;
  gap: 10px;
}

/* XP pill */
.xp{
  min-width: 220px;
  justify-content:space-between;
  gap: 12px;
}
.xp small{
  font-size: 13px;
  color: var(--muted);
  font-weight: 900;
  white-space: nowrap;
}
.xpbar{
  flex:1 1 auto;
  height: 8px;
  border-radius: 999px;
  background: rgba(255,255,255,.10);
  overflow:hidden;
  border: 1px solid rgba(255,255,255,.10);
}
#xpBar{
  height: 100%;
  width: 0%;
  border-radius: 999px;
  background: linear-gradient(90deg, var(--pink), var(--blue));
  box-shadow: 0 0 16px rgba(111,208,255,.25);
  transition: width .22s ease;
}

/* Pulse effect when values change */
.pulse{
  animation: pillPulse .28s ease;
}
@keyframes pillPulse{
  0%{ transform: scale(1); }
  55%{ transform: scale(1.02); }
  100%{ transform: scale(1); }
}

/* Buttons top right */
.actions{
  display:flex;
  align-items:center;
  gap: 10px;
}
.btn{
  height: var(--pillH);
  padding: 0 16px;
  border-radius: 999px;
  border: 1px solid rgba(255,255,255,.14);
  background: rgba(18,22,44,.35);
  color: var(--text);
  font-weight: 900;
  letter-spacing: .2px;
  cursor:pointer;
  box-shadow: inset 0 1px 0 rgba(255,255,255,.05);
}
.btn:hover{ border-color: rgba(255,255,255,.24); }
.btn:active{ transform: translateY(1px); }
.btn.primary{
  border: none;
  background: linear-gradient(135deg, rgba(255,79,163,.95), rgba(111,208,255,.95));
  color: #111;
}

/* ===========================
   HUD Icons sizing (IMPORTANT!)
   =========================== */
.iconBig{
  width: var(--hudIcon);
  height: var(--hudIcon);
  object-fit: contain;
  filter: drop-shadow(0 6px 14px rgba(0,0,0,.35));
}
.hearts{
  display:flex;
  align-items:center;
  gap: 10px;
}
.heartIcon{
  width: var(--heartIcon);
  height: var(--heartIcon);
  object-fit: contain;
  filter: drop-shadow(0 6px 14px rgba(0,0,0,.35));
}

/* Make hearts pill match others (no oversized heart zone) */
#pillHearts{
  min-width: 220px;
  justify-content:flex-start;
  gap: 14px;
}

/* ===========================
   STAGE / SCENE
   =========================== */
.stageWrap{
  flex:1 1 auto;
  min-height:0;
  overflow:hidden;
  display:flex;
}
.sceneWrap{
  position:relative;
  width:100%;
  height:100%;
  overflow:hidden;
}

/* Scene image full screen behind UI */
.sceneImg{
  position:absolute;
  inset:0;
  width:100%;
  height:100%;
  object-fit: cover;
  filter: saturate(1.05) contrast(1.02);
  transform: scale(1.02);
}

/* Soft vignette overlay */
#overlay{
  position:absolute;
  inset:0;
  pointer-events:none;
  background:
    radial-gradient(1200px 700px at 50% 40%, rgba(0,0,0,.0), rgba(0,0,0,.45) 72%, rgba(0,0,0,.70) 100%),
    linear-gradient(180deg, rgba(0,0,0,.18), rgba(0,0,0,.30));
}

/* Scene fallback */
.sceneFallback{
  position:absolute;
  inset:0;
  display:none;
  place-items:center;
  background: rgba(0,0,0,.6);
}
.sceneFallback .box{
  width:min(520px, 92vw);
  border-radius: 18px;
  padding: 18px 18px;
  background: rgba(18,22,44,.78);
  border: 1px solid rgba(255,255,255,.12);
  box-shadow: var(--shadow);
}

/* Floating action button */
.fabRow{
  position:absolute;
  right: 18px;
  top: 18px;
  z-index: 40;
}
.fab{
  height: 42px;
  padding: 0 16px;
  border-radius: 999px;
  border: 1px solid rgba(255,255,255,.16);
  background: rgba(18,22,44,.45);
  color: var(--text);
  font-weight: 950;
  cursor:pointer;
  backdrop-filter: blur(8px);
}
.fab:hover{ border-color: rgba(255,255,255,.26); }

/* ===========================
   Drawer
   =========================== */
.drawer{
  position:absolute;
  right: 14px;
  top: 68px;
  width: min(420px, 92vw);
  max-height: calc(100% - 86px);
  border-radius: 20px;
  background: rgba(12,16,34,.78);
  border: 1px solid rgba(255,255,255,.14);
  box-shadow: var(--shadow);
  backdrop-filter: blur(12px);
  transform: translateY(-10px);
  opacity: 0;
  pointer-events:none;
  z-index: 50;
  overflow:hidden;
}
.drawer.open{
  transform: translateY(0);
  opacity: 1;
  pointer-events:auto;
  transition: transform .18s ease, opacity .18s ease;
}
.drawerHd{
  display:flex;
  align-items:center;
  justify-content:space-between;
  padding: 14px 14px;
  border-bottom: 1px solid rgba(255,255,255,.10);
}
.drawerHd h3{
  margin:0;
  font-size: 16px;
  font-weight: 1000;
}
.drawerBd{
  padding: 14px 14px 16px;
  overflow:auto;
}
.mini{
  display:flex;
  gap: 12px;
  align-items:center;
}
.avatar{
  width:54px;height:54px;
  border-radius: 14px;
  overflow:hidden;
  background: rgba(255,255,255,.06);
  border:1px solid rgba(255,255,255,.10);
}
.avatar img{ width:100%;height:100%;object-fit:contain; }
.speech .name{
  font-weight:1000;
  margin-bottom: 2px;
}
.speech .line{
  color: var(--muted);
  font-size: 13px;
  font-weight: 750;
}
.pathlist{
  margin-top: 12px;
  display:flex;
  flex-direction:column;
  gap: 8px;
}
.tiny{
  font-size: 12px;
  color: var(--muted);
}

/* ===========================
   Boss HUD
   =========================== */
.bossHud{
  position:absolute;
  left: 18px;
  top: 18px;
  display:none;
  align-items:center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 999px;
  background: rgba(18,22,44,.55);
  border:1px solid rgba(255,255,255,.14);
  backdrop-filter: blur(10px);
  z-index: 45;
}
.bossName{
  font-weight: 1000;
  letter-spacing:.2px;
}
.bossBar{
  width: 180px;
  height: 10px;
  border-radius: 999px;
  background: rgba(255,255,255,.10);
  border: 1px solid rgba(255,255,255,.10);
  overflow:hidden;
  position:relative;
}
#bossBarFill{
  height: 100%;
  width: 100%;
  background: linear-gradient(90deg, #ff5252, #ff9f6a);
  border-radius: 999px;
  transition: width .18s ease;
}
.bossHitFlash{
  position:absolute; inset:0;
  background: rgba(255,255,255,.35);
  opacity:0;
}
.dmg{
  position:absolute;
  left: 220px;
  top: 8px;
  z-index: 46;
  font-weight: 1000;
  color: #fff;
  opacity:0;
  transform: translateY(6px);
  text-shadow: 0 10px 30px rgba(0,0,0,.6);
}
.dmg.show{
  animation: dmgPop .55s ease;
}
@keyframes dmgPop{
  0%{ opacity:0; transform: translateY(10px) scale(.98); }
  20%{ opacity:1; }
  100%{ opacity:0; transform: translateY(-12px) scale(1.03); }
}

/* ===========================
   Fips Main Bubble
   =========================== */
.fipsMain{
  position:absolute;
  left: 18px;
  bottom: 18px;
  display:flex;
  align-items:flex-end;
  gap: 12px;
  z-index: 30;
  max-width: min(520px, 92vw);
}
.fipsMain .frame{
  width: 64px;
  height: 64px;
  border-radius: 18px;
  overflow:hidden;
  background: rgba(255,255,255,.06);
  border:1px solid rgba(255,255,255,.10);
  box-shadow: 0 12px 30px rgba(0,0,0,.35);
}
.fipsMain .frame img{ width:100%; height:100%; object-fit:contain; }
.fipsMain .bubble{
  flex:1 1 auto;
  border-radius: 18px;
  padding: 12px 14px;
  background: rgba(18,22,44,.55);
  border: 1px solid rgba(255,255,255,.12);
  backdrop-filter: blur(10px);
  box-shadow: 0 16px 40px rgba(0,0,0,.35);
}
.fipsMain .bubble b{
  font-weight: 1000;
}
.fipsMain .bubble .line{
  margin-top: 4px;
  color: var(--muted);
  font-weight: 750;
  font-size: 13px;
}

/* ===========================
   Gate Open Card
   =========================== */
.gateOpen{
  position:absolute;
  inset:0;
  display:none;
  place-items:center;
  z-index: 70;
  background: rgba(0,0,0,.55);
}
.gateOpen .card{
  width: min(520px, 92vw);
  border-radius: 20px;
  padding: 16px 18px;
  background: rgba(18,22,44,.82);
  border: 1px solid rgba(255,255,255,.14);
  box-shadow: var(--shadow);
}

/* ===========================
   Pergament / Quest UI (bottom)
   =========================== */
.pergBar{
  position:absolute;
  left: 50%;
  transform: translateX(-50%);
  bottom: 18px;
  width: min(1120px, 96vw);
  z-index: 35;
}
.pergInner{
  position:relative;
  border-radius: 22px;
  overflow:hidden;
  background: rgba(18,22,44,.52);
  border: 1px solid rgba(255,255,255,.12);
  box-shadow: 0 22px 70px rgba(0,0,0,.50);
  backdrop-filter: blur(10px);
}

/* parchment texture - subtle */
.pergImg{
  position:absolute;
  inset:0;
  width:100%;
  height:100%;
  object-fit: cover;
  opacity:.14;
  filter: contrast(1.05) saturate(.9);
  pointer-events:none;
}
.pergContent{
  position:relative;
  padding: 14px 16px 14px;
}

/* top line inside perg */
.pergTopLine{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap: 12px;
  margin-bottom: 10px;
}
.sceneMeta{
  font-weight: 950;
  color: var(--muted);
  font-size: 13px;
}
.sceneMeta b{ color: var(--text); }
.qRight{
  display:flex;
  align-items:center;
  gap: 10px;
}
.qMeta{
  font-size: 13px;
  font-weight: 1000;
  color: var(--muted);
}
.dots{
  display:flex;
  gap: 6px;
}
.dots .d{
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: rgba(255,255,255,.18);
  border: 1px solid rgba(255,255,255,.10);
}
.dots .d.on{
  background: linear-gradient(135deg, var(--pink), var(--blue));
  border: none;
  box-shadow: 0 0 12px rgba(255,79,163,.20);
}

/* read text and question */
.readText{
  border-radius: 16px;
  padding: 12px 12px;
  background: rgba(0,0,0,.22);
  border: 1px solid rgba(255,255,255,.08);
  font-size: 16px;
  line-height: 1.35;
  font-weight: 800;
  color: rgba(234,240,255,.95);
}
.questionLine{
  margin-top: 10px;
  font-size: 18px;
  font-weight: 1000;
  letter-spacing:.2px;
}

/* answers row */
.answersRow{
  margin-top: 10px;
  display:flex;
  gap: 12px;
  align-items:stretch;
  justify-content:space-between;
  flex-wrap:wrap;
}
.ans{
  flex: 1 1 260px;
  min-height: 46px;
  display:flex;
  align-items:center;
  justify-content:center;
  text-align:center;
  padding: 10px 12px;
  border-radius: 999px;
  background: rgba(18,22,44,.42);
  border: 1px solid rgba(255,255,255,.14);
  color: var(--text);
  font-weight: 1000;
  letter-spacing: .2px;
  cursor:pointer;
  user-select:none;
  box-shadow: inset 0 1px 0 rgba(255,255,255,.05);
}
.ans:hover{ border-color: rgba(255,255,255,.24); }
.ans.correct{
  border-color: rgba(69,212,131,.45);
  box-shadow: 0 0 0 3px rgba(69,212,131,.12);
}
.ans.wrong{
  border-color: rgba(255,107,107,.45);
  box-shadow: 0 0 0 3px rgba(255,107,107,.12);
}

/* footer inside perg */
.pergFoot{
  margin-top: 12px;
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap: 12px;
  flex-wrap:wrap;
}
.statusline{
  color: var(--muted);
  font-weight: 900;
  font-size: 13px;
}
.btnSmall{
  height: 42px;
  padding: 0 14px;
  border-radius: 999px;
  border: 1px solid rgba(255,255,255,.14);
  background: rgba(18,22,44,.36);
  color: var(--text);
  font-weight: 950;
  cursor:pointer;
}
.btnSmall:hover{ border-color: rgba(255,255,255,.24); }
.btnSmall:disabled{
  opacity:.45;
  cursor:not-allowed;
}

/* ===========================
   Toast
   =========================== */
.toast{
  position:fixed;
  left: 50%;
  bottom: 18px;
  transform: translateX(-50%) translateY(10px);
  padding: 12px 16px;
  border-radius: 999px;
  background: rgba(18,22,44,.72);
  border: 1px solid rgba(255,255,255,.14);
  box-shadow: var(--shadow);
  color: var(--text);
  font-weight: 950;
  opacity:0;
  pointer-events:none;
  z-index: 90;
  backdrop-filter: blur(10px);
}
.toast.show{
  opacity:1;
  transform: translateX(-50%) translateY(0);
  transition: opacity .15s ease, transform .15s ease;
}

/* ===========================
   Celebrate / Oops overlays
   =========================== */
.celebrate, .oops{
  position:fixed;
  inset:0;
  display:none;
  z-index: 100;
}
.celebrate.show, .oops.show{ display:block; }
.celebrate .stage, .oops .stage{
  position:absolute;
  inset:0;
  background: radial-gradient(800px 500px at 50% 45%, rgba(0,0,0,.12), rgba(0,0,0,.70));
  backdrop-filter: blur(2px);
}
.celebrateBadge{
  position:absolute;
  left: 50%;
  top: 16%;
  transform: translateX(-50%);
  display:flex;
  align-items:center;
  gap: 10px;
  padding: 12px 16px;
  border-radius: 999px;
  background: rgba(18,22,44,.80);
  border: 1px solid rgba(255,255,255,.14);
  box-shadow: var(--shadow);
  font-weight: 1000;
}
.miniStar{
  width: 28px;
  height: 28px;
  display:grid;
  place-items:center;
  border-radius: 999px;
  background: rgba(255,211,106,.18);
  color: var(--gold);
  border: 1px solid rgba(255,211,106,.25);
}
.rays{
  position:absolute;
  left:50%;
  top:52%;
  transform: translate(-50%,-50%);
  width: min(70vh, 620px);
  height: min(70vh, 620px);
  border-radius: 999px;
  background: conic-gradient(
    from 0deg,
    rgba(255,79,163,.16),
    rgba(111,208,255,.14),
    rgba(255,211,106,.10),
    rgba(255,79,163,.16)
  );
  filter: blur(1px);
  opacity:.55;
  animation: raysSpin 6s linear infinite;
}
@keyframes raysSpin{
  from{ transform: translate(-50%,-50%) rotate(0deg); }
  to{ transform: translate(-50%,-50%) rotate(360deg); }
}

/* Oops badge */
.oopsBadge{
  position:absolute;
  left: 50%;
  top: 16%;
  transform: translateX(-50%);
  display:flex;
  align-items:center;
  gap: 10px;
  padding: 12px 16px;
  border-radius: 999px;
  background: rgba(18,22,44,.80);
  border: 1px solid rgba(255,255,255,.14);
  box-shadow: var(--shadow);
  font-weight: 1000;
}
.miniMark{
  width: 28px;
  height: 28px;
  display:grid;
  place-items:center;
  border-radius: 999px;
  background: rgba(255,107,107,.16);
  color: var(--bad);
  border: 1px solid rgba(255,107,107,.25);
}

/* Confetti container (optional) */
.confetti{
  position:absolute;
  inset:0;
  pointer-events:none;
}

/* ===========================
   RESPONSIVE
   =========================== */
@media (max-width: 980px){
  body{ overflow:hidden; }
  .topbar-inner{ padding: 10px 14px; }
  .brand .title{ font-size: 18px; }
  .brand .sub{ font-size: 12px; }
  .xp{ min-width: 200px; }
  .pergBar{ bottom: 12px; }
  .pergContent{ padding: 12px 12px; }
  .readText{ font-size: 15px; }
  .questionLine{ font-size: 17px; }
}
@media (max-width: 560px){
  .brandRow{ margin-bottom: 8px; }
  .pill, .xp, .btn{ height: 42px; }
  .xp{ min-width: 180px; }
  .ans{ flex: 1 1 100%; }
  .fipsMain{ display:none; } /* auf sehr kleinen Screens nicht im Weg */
}
