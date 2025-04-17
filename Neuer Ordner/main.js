// Neue Skins: Emoji statt SVG
// Panda: 🐼, Katze: 🐱
const animals = [
    {
      name: "Panda",
      emoji: "🐼",
      clickLabel: "Panda klicken",
    },
    {
      name: "Katze",
      emoji: "🐱",
      clickLabel: "Katze klicken",
    },
  ];
  
  // Wir fassen alle Upgrades gemeinsam für den United-Shop zusammen!
  const baseUpgradeDefinitions = [
    {
      name: "Starker Finger",
      desc: "+1 pro Klick",
      cost: 25,
      costInc: 1.7,
      type: "click",
      value: 1,
    },
    {
      name: "Kekskrümel",
      desc: "Automatisch +1 pro Sekunde",
      cost: 100,
      costInc: 1.8,
      type: "auto",
      value: 1,
    },
    {
      name: "Dicker Finger",
      desc: "+5 pro Klick",
      cost: 300,
      costInc: 2,
      type: "click",
      value: 5,
    },
    {
      name: "Hilfs-Katzen",
      desc: "Automatisch +10 pro Sekunde",
      cost: 900,
      costInc: 2,
      type: "auto",
      value: 10,
    },
  ];
  
  const xlUpgrades = [
    {
      name: "Bauhaus-Stil",
      desc: "Wechsle Design auf Bauhaus",
      type: "design",
      cost: 2000,
      callback: () => setTheme('bauhaus')
    },
    {
      name: "Tier-Skin: XL",
      desc: "Tier im XXL-Modus",
      type: "visual",
      cost: 3500,
      callback: () => {
        document.querySelector(".animal-btn").style.transform='scale(1.25)';
        setTimeout(()=>{document.querySelector(".animal-btn").style.transform=''},2000);
      }
    },
    {
      name: "Superklick",
      desc: "+25 pro Klick",
      type: "click",
      cost: 7000,
      callback: () => {state.clickValue += 25;}
    }
  ];
  
  const xxlUpgrades = [
    {
      name: "Maxi-Autoklicker",
      desc: "+100 pro Sekunde",
      type: "auto",
      cost: 30000,
      callback: () => {state.auto += 100; state.autoRate += 100;}
    },
    {
      name: "Musik Upgrade",
      desc: "Spiele Bauhaus Musik ab!",
      type: "music",
      cost: 40000,
      callback: () => {musicActive = true; playMelody(); updateMusicBtn();}
    },
    {
      name: "Alle Designs freischalten",
      desc: "Wähle jedes Theme & alle Styles!",
      type: "design",
      cost: 50000,
      callback: () => {
        document.querySelectorAll('.design-options button').forEach(b=>b.disabled=false);
      }
    }
  ];
  
  // App State
  let state = {
    animal: 0,
    total: 0,
    clickValue: 9,
    upgrades: [0, 0, 0, 0],
    auto: 0,
    autoRate: 0,
    xlBought: [false, false, false],
    xxlBought: [false, false, false],
    theme: "default"
  };
  
  // Musik- und Sound
  let context;
  let musicSource = null;
  let musicActive = false;
  let currentMelodyNote = 0;
  
  const bauhausMelody = [
   // Cooles, simples 'Bauhaus'-Motiv in MIDI notiert: (Frequencies in Hz, Durations in s)
    [391.995, 0.23], [523.25, 0.18], [659.26, 0.14], [523.25, 0.10], [698.46,0.25], [622.25,0.17], [0,0.09],
    [391.995, 0.15], [391.995,0.13], [0,0.1],
    [329.63, 0.23], [391.995,0.14],[466.16,0.28], [391.995,0.14], [0,0.13],
    [587.33,0.12], [659.26,0.20], [783.99,0.17], [392,0.09], [0,0.18]
  ];
  
  function playMelody() {
    if(!musicActive) return;
    if(!context) context = new AudioContext();
    const t = context.currentTime;
    let noteT = t;
    for(let i=0; i<bauhausMelody.length; i++) {
      const [freq, dur] = bauhausMelody[i];
      if(freq>0) {
        const osc = context.createOscillator();
        const gain = context.createGain();
        osc.type = "triangle";
        osc.frequency.value = freq;
        gain.gain.value = 0.16;
        osc.connect(gain).connect(context.destination);
        osc.start(noteT);
        osc.stop(noteT+dur);
        osc.onended = ()=> {osc.disconnect(); gain.disconnect();}
      }
      noteT += dur;
    }
    // Nächste Schleife für endloses Loop
    setTimeout(()=>{
      if(musicActive) playMelody();
    }, Math.round(bauhausMelody.reduce((a,[,d])=>a+d,0)*1000));
  }
  
  // Coin-Klick sound
  function playClickSound() {
    if(!context) context = new AudioContext();
    const osc = context.createOscillator();
    osc.type = "square";
    osc.frequency.value = 210 + Math.random()*65;
    const gain = context.createGain();
    gain.gain.value = 0.085;
    osc.connect(gain).connect(context.destination);
    osc.start();
    osc.stop(context.currentTime+0.11 + Math.random()*0.03);
    osc.onended=()=>{osc.disconnect();gain.disconnect();}
  }
  
  // Funktionen für die Shop-Kombination
  
  // Unified Shop Upgrades (merge all into one list at runtime)
  function getFullShopList() {
    // "base-0", "base-1", ... for basic upgrades,
    // "xl-0", ... for xl upgrades,
    // "xxl-0", ... for xxl upgrades.
    let arr = [];
    baseUpgradeDefinitions.forEach((u, i) => arr.push({ group: "base", idx: i, up: u }));
    xlUpgrades.forEach((u, i) => arr.push({ group: "xl", idx: i, up: u }));
    xxlUpgrades.forEach((u, i) => arr.push({ group: "xxl", idx: i, up: u }));
    return arr;
  }
  
  // --- Unified Shop UI --- 
  function updateShop() {
    const ul = document.getElementById("shop-list");
    if(!ul) return; // Modal noch nicht da
    ul.innerHTML = '';
    const fullList = getFullShopList();
  
    for(const item of fullList) {
      let already = false;
      let cost = item.up.cost;
      let bought = 0;
      let locked = false;
      if(item.group === "base") {
        bought = state.upgrades[item.idx];
        cost = getUpgradeCost(item.idx);
        if(state.total < cost) locked = true;
      } else if(item.group === "xl") {
        already = state.xlBought[item.idx];
        if(already) locked = true;
        if(state.total < cost) locked = true;
      } else if(item.group === "xxl") {
        already = state.xxlBought[item.idx];
        if(already) locked = true;
        if(state.total < cost) locked = true;
      }
  
      const li = document.createElement('li');
      li.className = "shop-item" + (locked ? " locked" : "");
      let btnText = "Kaufen";
      if(already) btnText = "Gekauft";
      else if(bought > 0) btnText += ` (${bought})`;
  
      const button = document.createElement('button');
      button.textContent = btnText;
      button.disabled = locked || already;
      button.tabIndex = 0;
  
      if(item.group === "base") {
        button.addEventListener("click", () => buyUpgrade(item.idx));
      } else if(item.group === "xl") {
        button.addEventListener("click", () => buyXLUpgrade(item.idx));
      } else if(item.group === "xxl") {
        button.addEventListener("click", () => buyXXLUpgrade(item.idx));
      }
  
      li.innerHTML = `
        <div class="desc"><strong>${item.up.name}</strong><br><small>${item.up.desc}</small></div>
        <div class="cost">${formatAmount(cost)}</div>
      `;
      li.appendChild(button);
      ul.appendChild(li);
    }
  }
  
  function getUpgradeCost(idx) {
    const def = baseUpgradeDefinitions[idx];
    return Math.floor(def.cost * Math.pow(def.costInc, state.upgrades[idx]));
  }
  
  function buyUpgrade(idx) {
    const cost = getUpgradeCost(idx);
    if (state.total >= cost) {
      state.total -= cost;
      state.upgrades[idx] += 1;
      if (baseUpgradeDefinitions[idx].type === "click") {
        state.clickValue += baseUpgradeDefinitions[idx].value;
      } else if (baseUpgradeDefinitions[idx].type === "auto") {
        state.auto += baseUpgradeDefinitions[idx].value;
        state.autoRate += baseUpgradeDefinitions[idx].value;
      }
      updateCounter();
      updateShop();
      saveGame();
    }
  }
  function buyXLUpgrade(idx) {
    const up = xlUpgrades[idx];
    if(state.xlBought[idx]) return;
    if(state.total < up.cost) return;
    state.total -= up.cost;
    state.xlBought[idx] = true;
    if (up.callback) up.callback();
    if(up.type === "click") state.clickValue += 25;
    saveGame();
    updateShop();
    updateCounter();
  }
  function buyXXLUpgrade(idx) {
    const up = xxlUpgrades[idx];
    if(state.xxlBought[idx]) return;
    if(state.total < up.cost) return;
    state.total -= up.cost;
    state.xxlBought[idx] = true;
    if(up.callback) up.callback();
    saveGame();
    updateShop();
    updateCounter();
  }
  
  function updateCounter() {
    document.getElementById("total-pandas").textContent = state.total;
  }
  function formatAmount(val) {
    if (val >= 1000000) return (val/1000000).toFixed(2)+" Mio";
    if (val >= 10000) return (val/1000).toFixed(1)+"k";
    return val;
  }
  
  // ========== Click/Animation/Autosammeln ===========
  
  function updateAnimalSVG() {
    const btn = document.getElementById("animal-btn");
    btn.innerHTML = `<span class="animal-emoji" aria-hidden="true">${animals[state.animal].emoji}</span>`;
    btn.setAttribute("aria-label", animals[state.animal].clickLabel);
  
    btn.animate([
      { transform: "scale(0.91)" },
      { transform: "scale(1.08)" },
      { transform: "scale(1.02)" },
      { transform: "scale(1.0)" }
    ], {
      duration: 390,
      easing: "cubic-bezier(0.38,1.24,0.84,1.19)"
    });
  }
  
  function clickAnimal() {
    state.total += state.clickValue;
    updateCounter();
    updateShop();
    saveGame();
    popEffect();
    playClickSound();
  }
  
  function popEffect() {
    const span = document.createElement('span');
    span.textContent = `+${state.clickValue}`;
    span.className = "pop-effect";
    span.style.position = "absolute";
    span.style.left = "50%";
    span.style.top = "45%";
    span.style.transform = "translate(-50%, -80%)";
    span.style.fontWeight = "bold";
    span.style.fontSize = "1.62em";
    span.style.color = "var(--pop-color,#56ac3d)";
    span.style.pointerEvents = "none";
    span.style.textShadow = "0 1px 10px #fff8";
    span.style.opacity = "1";
    const parent = document.getElementById("animal-btn");
    parent.appendChild(span);
  
    span.animate([
      { transform: "translate(-50%, -80%) scale(1)", opacity: 1 },
      { transform: "translate(-50%, -138%) scale(1.25)", opacity: 0 }
    ], { duration: 540, easing: "cubic-bezier(0.51,0.7,0.32,1.5)" }).onfinish = () => {
      span.remove();
    };
  }
  
  // Autosammeln
  setInterval(() => {
    if (state.auto > 0) {
      state.total += state.auto;
      updateCounter();
      updateShop();
      saveGame();
    }
  }, 1000);
  
  function render() {
    updateAnimalSVG();
    updateCounter();
    // updateShop(); <- Shop wird nur im Modal geladen!
    updateThemeBtns();
  }
  
  function saveGame() {
    try {
      localStorage.setItem("panda_clicker_save_v2", JSON.stringify(state));
    } catch(e){}
  }
  function loadGame() {
    try {
      const val = JSON.parse(localStorage.getItem("panda_clicker_save_v2"));
      if (!val) return;
      state = Object.assign({}, state, val);
      // Migration falls alte Werte fehlen:
      let calcAuto = 0;
      baseUpgradeDefinitions.forEach((u, i) => {
        if(u.type === "auto") calcAuto += u.value * (state.upgrades[i]||0);
      });
      state.auto = calcAuto;
      let clv = 1;
      baseUpgradeDefinitions.forEach((u, i) => {
        if(u.type === "click") clv += u.value*(state.upgrades[i]||0);
      });
      state.clickValue = clv + (state.xlBought && state.xlBought[2] ? 25 : 0);
      if(!state.xlBought) state.xlBought = [false, false, false];
      if(!state.xxlBought) state.xxlBought = [false, false, false];
      state.theme = (val.theme) ? val.theme : "default";
    } catch(e) { }
  }
  
  // Tiere wechseln
  function switchAnimal() {
    state.animal = (state.animal + 1) % animals.length;
    document.getElementById("switch-animal-btn").textContent =
      state.animal === 0 ? "Wechsle zu Katze" : "Wechsle zu Panda";
    updateAnimalSVG();
    saveGame();
  }
  
  // THEMES
  function setTheme(theme) {
    document.documentElement.classList.remove("theme-default","theme-bauhaus","theme-dark");
    if(theme==="bauhaus") {
      document.documentElement.classList.add("theme-bauhaus");
    } else if(theme==="dark") {
      document.documentElement.classList.add("theme-dark");
    } else {
      document.documentElement.classList.add("theme-default");
    }
    state.theme = theme;
    updateThemeBtns();
    saveGame();
  }
  function updateThemeBtns() {
    document.getElementById("theme-default-btn").classList.toggle('selected', state.theme === "default");
    document.getElementById("theme-bauhaus-btn").classList.toggle('selected', state.theme === "bauhaus");
    document.getElementById("theme-dark-btn").classList.toggle('selected', state.theme === "dark");
  }
  
  // Musik-Button UI
  function updateMusicBtn() {
    document.getElementById("music-toggle-btn").textContent = musicActive ? "🎶 Musik läuft" : "🎵 Musik";
    document.getElementById("music-toggle-btn").classList.toggle('selected',musicActive);
  }
  
  // Musik starten/stoppen
  function toggleMusic() {
    musicActive = !musicActive;
    updateMusicBtn();
    if(musicActive) {
      playMelody();
    } else {
      if(context) context.close();
      context = null;
    }
    saveGame();
  }
  
  // === PRO KLICK +10 Button ===
  function bonusClickValue() {
    state.clickValue += 15;
    popEffect();
    saveGame();
  }
  
  // --- MODAL LOGIK für Shop ---
  function showShopModal() {
    document.getElementById("shop-modal").style.display = "block";
    updateShop();
  }
  function hideShopModal() {
    document.getElementById("shop-modal").style.display = "none";
  }
  
  // ----------- ERSTER RENDER ----------
  window.addEventListener("DOMContentLoaded", () => {
    loadGame();
    render();
    setTheme(state.theme);
  
    document.getElementById("animal-btn").addEventListener("click", clickAnimal);
    document.getElementById("switch-animal-btn").addEventListener("click", switchAnimal);
  
    document.getElementById("music-toggle-btn").addEventListener("click", ()=>{
      toggleMusic();
      if(musicActive && context && context.state==="suspended") context.resume();
    });
    updateMusicBtn();
  
    document.getElementById("theme-default-btn").addEventListener('click',()=>setTheme("default"));
    document.getElementById("theme-bauhaus-btn").addEventListener('click',()=>setTheme("bauhaus"));
    document.getElementById("theme-dark-btn").addEventListener('click',()=>setTheme("dark"));
  
    document.getElementById('admin-menu-btn').onclick = showAdminModal;
  
    // SHOP MODAL Button
    document.getElementById('shop-modal-btn').onclick = showShopModal;
    document.getElementById('close-shop-modal').onclick = hideShopModal;
    document.getElementById('shop-modal').onclick = function(event) {
      if(event.target === document.getElementById('shop-modal')) hideShopModal();
    }
  
    // Pro Klick +10
    document.getElementById('plus10-btn').onclick = bonusClickValue;
  
    window.onclick = function(event) {
      if(event.target == document.getElementById('admin-modal')) { hideAdminModal(); }
    }
  
    // Mobile: Make animal image bigger with tap on small screens
    if(window.innerWidth < 500) {
      document.querySelector('.animal-emoji').style.fontSize = "5.3rem";
    }
  });
  
  // ...existing code below...
  
  // ==== Admin Menu Pin-Dialog/Logik ====
  
  let adminPinAccepted = false;
  
  function showAdminModal() {
    const modal = document.getElementById("admin-modal");
    const inner = document.getElementById("admin-modal-inner");
    if (!adminPinAccepted) {
      // Pin-Modus
      inner.innerHTML = `
        <span id="close-admin-modal" class="close">&times;</span>
        <h2>Admin Menü</h2>
        <div style="margin-bottom:1.5em;">
          <label for="admin-pin-input" style="font-size:1.12em">Bitte Admin-PIN eingeben:</label>
          <input type="password" id="admin-pin-input" maxlength="8" style="margin-left:0.75em;padding:0.3em 0.7em;font-size:1.12em;border-radius:7px;border:1.6px solid #b2bccd;">
        </div>
        <div id="admin-pin-error" style="color:#d22;display:none;font-size:1.04em;margin-bottom:1em;">Falscher PIN!</div>
        <button id="admin-pin-submit-btn" style="background:#e0e4f9;color:#222;font-weight:bold;">Freischalten</button>
      `;
      modal.style.display = 'block';
      document.getElementById("close-admin-modal").onclick = hideAdminModal;
      document.getElementById("admin-pin-submit-btn").onclick = tryAdminPin;
      document.getElementById("admin-pin-input").onkeydown = (e) => {
        if(e.key === "Enter") tryAdminPin();
      };
      setTimeout(()=>{document.getElementById("admin-pin-input").focus();}, 120);
      return;
    }
  
    // Freigeschaltetes Admin Menu
    inner.innerHTML = `
      <span id="close-admin-modal" class="close">&times;</span>
      <h2>Admin Menü</h2>
      <button id="admin-1000plus-btn">+1000 Coins</button>
      <button id="admin-10click-btn">Klickwert +10</button>
      <button id="reset-btn">Reset Spiel</button>
      <hr>
      <strong>Design Option</strong>
      <div style="margin:1em 0;display:flex;gap:0.9em;">
          <button id="admin-theme-default-btn">Standard</button>
          <button id="admin-theme-bauhaus-btn">Bauhaus</button>
          <button id="admin-theme-dark-btn">Nacht</button>
      </div>
    `;
    modal.style.display = 'block';
    document.getElementById('close-admin-modal').onclick = hideAdminModal;
    document.getElementById('admin-1000plus-btn').onclick = ()=>{state.total+=1000; updateCounter(); updateShop(); saveGame();};
    document.getElementById('admin-10click-btn').onclick = ()=>{state.clickValue+=10; popEffect(); saveGame();};
    document.getElementById('reset-btn').onclick = ()=>{localStorage.removeItem("panda_clicker_save_v2"); window.location.reload();};
    document.getElementById('admin-theme-default-btn').onclick = ()=>setTheme("default");
    document.getElementById('admin-theme-bauhaus-btn').onclick = ()=>setTheme("bauhaus");
    document.getElementById('admin-theme-dark-btn').onclick = ()=>setTheme("dark");
  }
  
  function tryAdminPin() {
    const input = document.getElementById("admin-pin-input");
    const err = document.getElementById("admin-pin-error");
    if(input.value === "1234") {
      adminPinAccepted = true;
      showAdminModal();
    } else {
      err.style.display = "";
      input.style.borderColor = "#d22";
      input.value = "";
      input.focus();
    }
  }
  
  function hideAdminModal() {
    const modal = document.getElementById("admin-modal");
    modal.style.display = 'none';
  }
  
  // Stil für Emoji
  const animalEmojiStyle = document.createElement('style');
  animalEmojiStyle.textContent = `
    .animal-emoji {
      font-size: 8.5rem;
      line-height: 1;
      display: block;
      user-select: none;
      pointer-events: none;
      filter: drop-shadow(0 2px 4px #2221a533);
    }
    @media (max-width:600px) {
      .animal-emoji { font-size: 5.3rem;}
    }
    #animal-btn { position: relative; overflow: visible;}
    .pop-effect { pointer-events:none; user-select:none; }
  `;
  document.head.appendChild(animalEmojiStyle);
  
  // Beim Start Theme setzen
  if(document.readyState!=="loading") setTheme(state.theme);
  else window.addEventListener("DOMContentLoaded",()=>setTheme(state.theme));