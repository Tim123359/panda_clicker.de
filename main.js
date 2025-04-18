// === Tiere mit Emoji statt SVG ===
const animals = [
  { name: "Panda", emoji: "🐼", clickLabel: "Panda klicken" },
  { name: "Katze", emoji: "🐱", clickLabel: "Katze klicken" }
];

// === Grund-Upgrades für Klick & Auto-Einnahmen ===
const baseUpgradeDefinitions = [
  { name: "Starker Finger", desc: "+1 pro Klick", cost: 25, costInc: 1.7, type: "click", value: 1 },
  { name: "Kekskrümel", desc: "Automatisch +1 pro Sekunde", cost: 100, costInc: 1.8, type: "auto", value: 1 },
  { name: "Dicker Finger", desc: "+5 pro Klick", cost: 300, costInc: 2.0, type: "click", value: 5 },
  { name: "Hilfs-Katzen", desc: "Automatisch +10 pro Sekunde", cost: 900, costInc: 2.0, type: "auto", value: 10 }
];

// === XL-Upgrades (einmalig) ===
const xlUpgrades = [
  {
    name: "Bauhaus-Stil",
    desc: "Wechsle Design auf Bauhaus",
    type: "design",
    cost: 2000,
    callback: () => setTheme("bauhaus")
  },
  {
    name: "Tier-Skin: XL",
    desc: "Tier im XXL-Modus",
    type: "visual",
    cost: 3500,
    callback: () => {
      const animalBtn = document.querySelector(".animal-btn");
      if (animalBtn) {
        animalBtn.style.transform = "scale(1.25)";
        setTimeout(() => { animalBtn.style.transform = ""; }, 2000);
      }
    }
  },
  {
    name: "Superklick",
    desc: "+25 pro Klick",
    type: "click",
    cost: 7000,
    callback: () => { state.clickValue += 25; }
  }
];

// === XXL-Upgrades ===
const xxlUpgrades = [
  {
    name: "Maxi-Autoklicker",
    desc: "+100 pro Sekunde",
    type: "auto",
    cost: 30000
  },
  {
    name: "Musik Upgrade",
    desc: "Spiele Bauhaus Musik ab!",
    type: "music",
    cost: 40000,
    callback: () => {
      musicActive = true;
      playMelody();
      updateMusicBtn();
    }
  },
  {
    name: "Alle Designs freischalten",
    desc: "Wähle jedes Theme & alle Styles!",
    type: "design",
    cost: 50000,
    callback: () => {
      document.querySelectorAll(".design-options button").forEach(b => b.disabled = false);
    }
  }
];

// === App State ===
let state = {
  animal: 0,
  total: 0,
  clickValue: 1,
  upgrades: [0, 0, 0, 0],
  autoRate: 0,
  xlBought: [false, false, false],
  xxlBought: [false, false, false],
  theme: "default"
};

// === Musik ===
let context;
let musicActive = false;
let melodyTimeoutId = null;

const bauhausMelody = [
  [391.995, 0.23], [523.25, 0.18], [659.26, 0.14], [523.25, 0.10], [698.46, 0.25], [622.25, 0.17], [0, 0.09],
  [391.995, 0.15], [391.995, 0.13], [0, 0.1],
  [329.63, 0.23], [391.995, 0.14], [466.16, 0.28], [391.995, 0.14], [0, 0.13],
  [587.33, 0.12], [659.26, 0.20], [783.99, 0.17], [392, 0.09], [0, 0.18]
];

function playMelody() {
  if (!musicActive) return;

  if (!context) {
    try {
      context = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.error("Web Audio API wird nicht unterstützt.");
      return;
    }
  }

  if (context.state === "suspended") context.resume();

  let noteT = context.currentTime;
  let totalDuration = 0;

  for (const [freq, dur] of bauhausMelody) {
    if (freq > 0) {
      const osc = context.createOscillator();
      const gain = context.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, noteT);
      gain.gain.setValueAtTime(0.16, noteT);
      gain.gain.linearRampToValueAtTime(0.0001, noteT + dur * 0.9);

      osc.connect(gain).connect(context.destination);
      osc.start(noteT);
      osc.stop(noteT + dur);

      osc.onended = () => {
        osc.disconnect();
        gain.disconnect();
      };
    }
    noteT += dur;
    totalDuration += dur;
  }

  clearTimeout(melodyTimeoutId);
  melodyTimeoutId = setTimeout(() => {
    if (musicActive) playMelody();
  }, Math.round(totalDuration * 1000));
}

function stopMelody() {
  clearTimeout(melodyTimeoutId);
  melodyTimeoutId = null;
}

// === Klick-Sound ===
function playClickSound() {
  if (!context) {
    try {
      context = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.error("Web Audio API wird nicht unterstützt.");
      return;
    }
  }

  if (context.state === "suspended") context.resume();

  const osc = context.createOscillator();
  osc.type = "square";
  osc.frequency.value = 210 + Math.random() * 65;

  const gain = context.createGain();
  gain.gain.setValueAtTime(0.085, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.13);

  osc.connect(gain).connect(context.destination);
  osc.start(context.currentTime);
  osc.stop(context.currentTime + 0.18);

  osc.onended = () => {
    osc.disconnect();
    gain.disconnect();
  };
}

// === Dummy-Funktionen ===
function setTheme(themeName) {
  console.log("Theme gesetzt:", themeName);
}

function updateMusicBtn() {
  console.log("Musikbutton aktualisiert");
}

// === Shop-Logik ===
function getFullShopList() {
  const arr = [];
  baseUpgradeDefinitions.forEach((u, i) => arr.push({ group: "base", idx: i, up: u }));
  xlUpgrades.forEach((u, i) => arr.push({ group: "xl", idx: i, up: u }));
  xxlUpgrades.forEach((u, i) => arr.push({ group: "xxl", idx: i, up: u }));
  return arr;
}

function updateShop() {
  const ul = document.getElementById("shop-list");
  if (!ul) return;
  ul.innerHTML = "";

  for (const item of getFullShopList()) {
    const li = document.createElement("li");
    li.className = "shop-item";
    li.setAttribute("data-group", item.group);
    li.setAttribute("data-index", item.idx);

    let cost = item.up.cost || getUpgradeCost(item.idx);
    let isBought = false;
    let locked = false;
    let level = 0;

    if (item.group === "base") {
      level = state.upgrades[item.idx] || 0;
      locked = state.total < cost;
    } else if (item.group === "xl") {
      isBought = state.xlBought[item.idx];
      locked = isBought || state.total < cost;
    } else if (item.group === "xxl") {
      isBought = state.xxlBought[item.idx];
      locked = isBought || state.total < cost;
    }

    li.classList.toggle("locked", locked);

    const desc = document.createElement("div");
    desc.className = "desc";
    desc.innerHTML = `<strong>${item.up.name}</strong><br><small>${item.up.desc}</small>`;

    const costDiv = document.createElement("div");
    costDiv.className = "cost";
    costDiv.textContent = formatAmount(cost);

    const button = document.createElement("button");
    button.textContent = isBought ? "Gekauft" : (item.group === "base" && level > 0 ? `Kaufen (${level})` : "Kaufen");
    button.disabled = locked;
    button.addEventListener("click", () => handleBuyClick(item.group, item.idx));

    li.append(desc, costDiv, button);
    ul.appendChild(li);
  }
}

function handleBuyClick(group, idx) {
  if (group === "base") buyUpgrade(idx);
  if (group === "xl") buyXLUpgrade(idx);
  if (group === "xxl") buyXXLUpgrade(idx);
}

function getUpgradeCost(idx) {
  const u = baseUpgradeDefinitions[idx];
  const level = state.upgrades[idx] || 0;
  return Math.floor(u.cost * Math.pow(u.costInc, level));
}

function buyUpgrade(idx) {
  const cost = getUpgradeCost(idx);
  if (state.total >= cost) {
    const upgrade = baseUpgradeDefinitions[idx];
    state.total -= cost;
    state.upgrades[idx]++;
    if (upgrade.type === "click") state.clickValue += upgrade.value;
    if (upgrade.type === "auto") state.autoRate += upgrade.value;
    updateShop();
  }
}

function buyXLUpgrade(idx) {
  const up = xlUpgrades[idx];
  if (!state.xlBought[idx] && state.total >= up.cost) {
    state.total -= up.cost;
    state.xlBought[idx] = true;
    if (up.type === "click") state.clickValue += up.value || 0;
    if (typeof up.callback === "function") up.callback();
    updateShop();
  }
}

function buyXXLUpgrade(idx) {
  const up = xxlUpgrades[idx];
  if (!state.xxlBought[idx] && state.total >= up.cost) {
    state.total -= up.cost;
    state.xxlBought[idx] = true;
    if (up.type === "auto") state.autoRate += up.value || 100;
    if (typeof up.callback === "function") up.callback();
    updateShop();
  }
}

function formatAmount(val) {
  return `${val.toLocaleString()} 🍪`;
}

// === Klickfunktion + Loop ===
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.querySelector(".animal-btn");
  const counter = document.getElementById("counter");

  btn.addEventListener("click", () => {
    state.total += state.clickValue;
    counter.textContent = formatAmount(state.total);
    playClickSound();
    updateShop();
  });

  updateShop();

  setInterval(() => {
    state.total += state.autoRate;
    counter.textContent = formatAmount(state.total);
    updateShop();
  }, 1000);
});
