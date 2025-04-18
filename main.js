const animals = ["🐶", "🐱", "🐰", "🦊", "🐼"];
let currentAnimal = 0;

const state = {
  score: 0,
  clickValue: 1,
  autoValue: 0,
  upgrades: [0, 0],
};

const upgrades = [
  { name: "+1 Klick", cost: 20, type: "click", value: 1 },
  { name: "+1 Auto/Sek", cost: 50, type: "auto", value: 1 }
];

const scoreDisplay = document.getElementById("score");
const clickBtn = document.getElementById("click-btn");
const shopList = document.getElementById("shop-list");

function updateScoreDisplay() {
  scoreDisplay.textContent = `${state.score.toLocaleString()} 🍪`;
}

clickBtn.addEventListener("click", () => {
  state.score += state.clickValue;
  updateScoreDisplay();
  updateShop();
});

function updateShop() {
  shopList.innerHTML = "";

  upgrades.forEach((up, i) => {
    const cost = Math.floor(up.cost * Math.pow(1.5, state.upgrades[i]));
    const li = document.createElement("li");
    li.className = "shop-item";

    const btn = document.createElement("button");
    btn.textContent = `${up.name} – ${cost} 🍪`;
    btn.disabled = state.score < cost;

    btn.addEventListener("click", () => {
      if (state.score >= cost) {
        state.score -= cost;
        state.upgrades[i]++;
        if (up.type === "click") state.clickValue += up.value;
        if (up.type === "auto") state.autoValue += up.value;
        updateScoreDisplay();
        updateShop();
      }
    });

    li.appendChild(btn);
    shopList.appendChild(li);
  });
}

function changeEmoji() {
  currentAnimal = (currentAnimal + 1) % animals.length;
  clickBtn.textContent = animals[currentAnimal];
}

setInterval(() => {
  state.score += state.autoValue;
  updateScoreDisplay();
}, 1000);

clickBtn.addEventListener("contextmenu", e => {
  e.preventDefault();
  changeEmoji(); // Rechtsklick = Skin wechseln
});

updateScoreDisplay();
updateShop();
