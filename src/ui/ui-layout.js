export function mountUILayout(root) {
  root.innerHTML = `
    <div class="topbar">
      <div class="topbar-inner">
        <div class="brand">
          <div class="dot"></div>
          <div>
            <div class="title">Leselabyrinth – Funkelwald</div>
            <div class="sub">Kinder-RPG Lesetraining · Szene-Pfad · Progression · Bonus-Sammeln</div>
          </div>
        </div>

        <div class="hud">
          <div class="pill" id="pillHearts" title="Leben (3 Herzen)">
            <span class="tiny"><b>Leben</b></span>
            <div class="hearts" id="hearts"></div>
          </div>

          <div class="pill" id="pillStars" title="Sterne (Bonus)">
            <img class="icon" src="assets/ui/icons/stern.png" alt="Stern" />
            <span><b id="starsVal">0</b></span>
            <span class="sep">|</span>
            <span class="tiny">Sterne</span>
          </div>

          <div class="pill" id="pillApples" title="Äpfel (Bonus)">
            <img class="icon" src="assets/ui/interactables/Apfel.png" alt="Apfel" />
            <span><b id="applesVal">0</b></span>
            <span class="sep">|</span>
            <span class="tiny">Äpfel</span>
          </div>

          <div class="pill" id="pillLanterns" title="Laternen (Bonus)">
            <img class="icon" src="assets/ui/interactables/Laterne.png" alt="Laterne" />
            <span><b id="lanternsVal">0</b></span>
            <span class="sep">|</span>
            <span class="tiny">Laternen</span>
          </div>

          <div class="pill" id="pillSparks" title="Geheimfunken (Bonus)">
            <img class="icon" src="assets/ui/icons/geheimfunke.png" alt="Geheimfunke" />
            <span><b id="sparksVal">0</b></span>
            <span class="sep">|</span>
            <span class="tiny">Funken</span>
          </div>

          <div class="pill" title="Serie, Stufe, Fokus">
            <span class="tiny">Serie</span> <b id="streakVal">0</b>
            <span class="sep">|</span>
            <span class="tiny">Stufe</span> <b id="levelVal">1</b>
            <span class="sep">|</span>
            <span class="tiny">Fokus</span> <b id="focusVal">W-Frage</b>
          </div>

          <div class="xp" id="pillXP" title="XP Fortschritt">
            <small><b>XP</b> <span id="xpVal">0</span>/<span id="xpNeed">100</span></small>
            <div class="xpbar"><div id="xpBar"></div></div>
          </div>

          <button class="btn" id="resetBtn">Reset</button>
          <button class="btn primary" id="helpBtn">Hilfe</button>
        </div>
      </div>
    </div>

    <div class="stageWrap">
      <div class="sceneWrap" id="sceneWrap">
        <img id="sceneImg" class="sceneImg" src="" alt="Szene" />

        <div class="sceneFallback" id="sceneFallback">
          <div class="box">
            <h3>Szene-Bild fehlt</h3>
            <p>Das Bild wurde nicht gefunden. Pfad prüfen: assets/scenes/…</p>
          </div>
        </div>

        <div class="overlay" id="overlay"></div>

        <div class="fabRow">
          <button class="fab" id="drawerBtn">Kapitel</button>
        </div>

        <div class="drawer" id="drawer">
          <div class="drawerHd">
            <h3>Kapitel: Funkelwald</h3>
            <button class="btn" id="drawerCloseBtn" style="padding:10px 12px;">Schließen</button>
          </div>
          <div class="drawerBd">
            <div class="mini">
              <div class="avatar"><img id="fipsAvatar" src="assets/chars/fips/idle.png" alt="Fips" /></div>
              <div class="speech">
                <div class="name">Fips</div>
                <div class="line" id="fipsLine">Bonus: Sammeln. Hauptziel: Fragen richtig beantworten.</div>
              </div>
            </div>

            <div class="tiny" style="margin-top:10px; font-weight:1000; opacity:.95;">
              Status: <span id="chapterStatus">0/5 erledigt</span>
            </div>

            <div class="pathlist" id="pathList"></div>
            <div class="tiny" id="unlockHint" style="margin-top:10px;">Freischaltung: Fragen richtig beantworten.</div>
          </div>
        </div>

        <div class="bossHud" id="bossHud">
          <span class="bossName" id="bossName">Boss</span>
          <div class="bossBar">
            <div id="bossBarFill"></div>
            <div class="bossHitFlash"></div>
          </div>
          <span class="tiny"><b id="bossHPText">9</b>/9</span>
        </div>
        <div class="dmg" id="dmg">-1</div>

        <div class="fipsMain">
          <div class="frame">
            <img id="fipsMainImg" src="assets/chars/fips/idle.png" alt="Fips" />
          </div>
          <div class="bubble">
            <b>Fips</b>
            <div class="line" id="fipsMainLine">Lies das Pergament. Beantworte Fragen. Sammeln ist Bonus.</div>
          </div>
        </div>

        <div class="gateOpen" id="gateOpen">
          <div class="card">
            <h3>Das Tor öffnet sich</h3>
            <p>Boss besiegt. Als Nächstes geht es in die Wasserwelt.</p>
          </div>
        </div>

        <div class="pergBar" id="pergBar">
          <div class="pergInner">
            <img class="pergImg" src="assets/ui/panels/parchment.png" alt="" aria-hidden="true" />

            <div class="pergContent">
              <div class="pergTopLine">
                <div class="sceneMeta"><b>Szene</b> <span id="sceneTitle">–</span></div>

                <div class="qRight">
                  <div class="qMeta" id="qProgress">Frage 1/3</div>
                  <div class="dots" id="dots"></div>
                </div>
              </div>

              <div class="readText" id="readText">–</div>
              <div class="questionLine" id="question">–</div>

              <div class="answersRow" id="answers"></div>

              <div class="pergFoot">
                <div class="statusline" id="statusLine">Status: <span class="tiny">offen</span></div>
                <div style="display:flex; gap:10px; flex-wrap:wrap;">
                  <button class="btnSmall" id="reReadBtn">Nochmal lesen</button>
                  <button class="btnSmall" id="nextBtn" disabled>Nächste Szene</button>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>

    <div class="toast" id="toast"></div>

    <div class="celebrate" id="celebrate">
      <div class="stage">
        <div class="rays"></div>
        <div class="celebrateBadge" id="celebrateBadge">
          <div class="miniStar" aria-hidden="true">★</div>
          <div id="celebrateText">Richtig</div>
        </div>
        <div class="confetti" id="confetti"></div>
        <div style="position:absolute;left:50%;top:54%;transform:translate(-50%,-50%);width:min(66vh,560px);height:min(66vh,560px);display:grid;place-items:center;filter:drop-shadow(0 40px 90px rgba(0,0,0,.55));">
          <img id="fipsGiantImg" src="assets/chars/fips/excited.png" alt="Fips" style="width:100%;height:100%;object-fit:contain;" />
        </div>
      </div>
    </div>

    <div class="oops" id="oops">
      <div class="stage">
        <div class="oopsBadge">
          <div class="miniMark" aria-hidden="true">!</div>
          <div id="oopsText">Nicht richtig</div>
        </div>

        <div style="position:absolute;left:50%;top:55%;transform:translate(-50%,-50%);width:min(58vh,520px);height:min(58vh,520px);display:grid;place-items:center;filter:drop-shadow(0 40px 90px rgba(0,0,0,.55));">
          <img id="oopsFipsImg" src="assets/chars/fips/sad.png" alt="Fips traurig" style="width:100%;height:100%;object-fit:contain;" />
        </div>
      </div>
    </div>
  `;
}

export function bindElements() {
  const $ = (id) => document.getElementById(id);

  return {
    sceneTitle: $("sceneTitle"),
    readText: $("readText"),
    question: $("question"),
    answers: $("answers"),
    reReadBtn: $("reReadBtn"),
    nextBtn: $("nextBtn"),
    statusLine: $("statusLine"),
    qProgress: $("qProgress"),
    dots: $("dots"),

    sceneImg: $("sceneImg"),
    sceneFallback: $("sceneFallback"),
    overlay: $("overlay"),
    gateOpen: $("gateOpen"),

    bossHud: $("bossHud"),
    bossName: $("bossName"),
    bossBarFill: $("bossBarFill"),
    bossHPText: $("bossHPText"),
    dmg: $("dmg"),

    fipsAvatar: $("fipsAvatar"),
    fipsLine: $("fipsLine"),
    fipsMainImg: $("fipsMainImg"),
    fipsMainLine: $("fipsMainLine"),

    pathList: $("pathList"),
    chapterStatus: $("chapterStatus"),
    unlockHint: $("unlockHint"),

    hearts: $("hearts"),
    starsVal: $("starsVal"),
    applesVal: $("applesVal"),
    lanternsVal: $("lanternsVal"),
    sparksVal: $("sparksVal"),
    streakVal: $("streakVal"),
    levelVal: $("levelVal"),
    focusVal: $("focusVal"),
    xpVal: $("xpVal"),
    xpNeed: $("xpNeed"),
    xpBar: $("xpBar"),

    pillHearts: $("pillHearts"),
    pillStars: $("pillStars"),
    pillApples: $("pillApples"),
    pillLanterns: $("pillLanterns"),
    pillSparks: $("pillSparks"),
    pillXP: $("pillXP"),

    resetBtn: $("resetBtn"),
    helpBtn: $("helpBtn"),

    toast: $("toast"),

    celebrate: $("celebrate"),
    confetti: $("confetti"),
    fipsGiantImg: $("fipsGiantImg"),
    celebrateText: $("celebrateText"),

    oops: $("oops"),
    oopsText: $("oopsText"),
    oopsFipsImg: $("oopsFipsImg"),

    drawerBtn: $("drawerBtn"),
    drawer: $("drawer"),
    drawerCloseBtn: $("drawerCloseBtn"),
  };
}

