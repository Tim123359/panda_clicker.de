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
        // Ensure the element exists before trying to style it
        const animalBtn = document.querySelector(".animal-btn");
        if (animalBtn) {
            animalBtn.style.transform='scale(1.25)';
            setTimeout(()=>{ if (animalBtn) animalBtn.style.transform=''; },2000);
        }
      }
    },
    {
      name: "Superklick",
      desc: "+25 pro Klick",
      type: "click",
      cost: 7000,
      // Note: Original had a callback setting state.clickValue += 25;
      // This is now handled directly in buyXLUpgrade based on type "click"
      // For consistency, let's keep it, but ensure it doesn't double-count.
      // We'll modify buyXLUpgrade to *not* add based on type if a callback handles it.
      callback: () => {state.clickValue += 25;} // Keep callback for clarity
    }
  ];

  const xxlUpgrades = [
    {
      name: "Maxi-Autoklicker",
      desc: "+100 pro Sekunde",
      type: "auto",
      cost: 30000,
       // Note: Original had a callback state.auto += 100; state.autoRate += 100;
       // Let's adjust buyXXLUpgrade to handle this based on type 'auto'
       // and remove the explicit callback here for consistency.
      // callback: () => {state.auto += 100; state.autoRate += 100;} // Removed, handled by type
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
    clickValue: 1, // Start click value should be 1 before upgrades
    upgrades: [0, 0, 0, 0],
    auto: 0, // Deprecated? Use autoRate
    autoRate: 0, // Correct state for auto-clicks per second
    xlBought: [false, false, false],
    xxlBought: [false, false, false],
    theme: "default"
  };

  // Musik- und Sound
  let context;
  let musicActive = false; // Should reflect loaded state
  // let musicSource = null; // Not used in the provided code
  // let currentMelodyNote = 0; // Not used in the provided code

  const bauhausMelody = [
   // Cooles, simples 'Bauhaus'-Motiv in MIDI notiert: (Frequencies in Hz, Durations in s)
    [391.995, 0.23], [523.25, 0.18], [659.26, 0.14], [523.25, 0.10], [698.46,0.25], [622.25,0.17], [0,0.09], // Bar 1
    [391.995, 0.15], [391.995,0.13], [0,0.1], // Bar 2
    [329.63, 0.23], [391.995,0.14],[466.16,0.28], [391.995,0.14], [0,0.13], // Bar 3
    [587.33,0.12], [659.26,0.20], [783.99,0.17], [392,0.09], [0,0.18] // Bar 4
  ];

  let melodyTimeoutId = null; // To properly manage the loop timeout

  function playMelody() {
    if(!musicActive) return;
    if(!context) {
        try {
            context = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.error("Web Audio API is not supported in this browser.");
            return;
        }
    }
     // Resume context if it was suspended (e.g., due to browser policy)
    if (context.state === 'suspended') {
        context.resume();
    }


    const t = context.currentTime;
    let noteT = t;
    let totalDuration = 0;

    bauhausMelody.forEach(([freq, dur]) => {
      if(freq > 0) {
        try {
            const osc = context.createOscillator();
            const gain = context.createGain();
            osc.type = "triangle";
            osc.frequency.setValueAtTime(freq, noteT); // Use setValueAtTime
            gain.gain.setValueAtTime(0.16, noteT); // Use setValueAtTime
            // Simple fade out to avoid clicks
            gain.gain.linearRampToValueAtTime(0.0001, noteT + dur * 0.9);


            osc.connect(gain).connect(context.destination);
            osc.start(noteT);
            osc.stop(noteT + dur);
            // Clean up nodes after they stop playing
            osc.onended = () => {
                osc.disconnect();
                gain.disconnect();
             };
        } catch (e) {
             console.error("Error playing note:", e);
        }
      }
      noteT += dur;
      totalDuration += dur;
    });

    // Clear any previous timeout to prevent overlapping loops
    if (melodyTimeoutId) {
        clearTimeout(melodyTimeoutId);
    }

    // Nächste Schleife für endloses Loop
    // Use totalDuration calculated accurately
    melodyTimeoutId = setTimeout(() => {
      // Check again if music is still active before playing next loop
      if(musicActive) {
           playMelody();
      }
    }, Math.round(totalDuration * 1000));
  }

  function stopMelody() {
       if (melodyTimeoutId) {
           clearTimeout(melodyTimeoutId);
           melodyTimeoutId = null;
       }
       // We don't necessarily close the context here, just stop looping.
       // Closing the context is better done when toggling music off completely.
  }


  // Coin-Klick sound
  function playClickSound() {
    if(!context) {
         try {
            context = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.error("Web Audio API is not supported in this browser for click sounds.");
            return;
        }
    }
    // Resume context if suspended
    if (context.state === 'suspended') {
        context.resume();
    }

    try {
        const osc = context.createOscillator();
        osc.type = "square";
        osc.frequency.value = 210 + Math.random()*65; // Original frequency
        const gain = context.createGain();
        gain.gain.setValueAtTime(0.085, context.currentTime); // Start volume
        // Quick fade out
        gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.11 + Math.random() * 0.03);


        osc.connect(gain).connect(context.destination);
        osc.start(context.currentTime);
        osc.stop(context.currentTime + 0.11 + Math.random() * 0.03 + 0.05); // Stop slightly after fade

        osc.onended = () => { // Clean up
            osc.disconnect();
            gain.disconnect();
        };
    } catch (e) {
        console.error("Error playing click sound:", e);
    }
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
    if(!ul) return; // Modal noch nicht da oder DOM nicht bereit
    ul.innerHTML = ''; // Clear previous items
    const fullList = getFullShopList();

    for(const item of fullList) {
      let isBought = false; // Use a more descriptive name than 'already'
      let cost = 0;
      let currentLevel = 0; // For base upgrades
      let locked = false; // Cannot afford or already bought (for non-base)

      if(item.group === "base") {
        currentLevel = state.upgrades[item.idx] || 0; // Default to 0 if undefined
        cost = getUpgradeCost(item.idx);
        if(state.total < cost) locked = true;
      } else if(item.group === "xl") {
        cost = item.up.cost;
        isBought = state.xlBought[item.idx] || false;
        if(isBought || state.total < cost) locked = true;
      } else if(item.group === "xxl") {
        cost = item.up.cost;
        isBought = state.xxlBought[item.idx] || false;
        if(isBought || state.total < cost) locked = true;
      }

      const li = document.createElement('li');
      li.className = "shop-item" + (locked ? " locked" : "");
      li.setAttribute('data-group', item.group); // Add data attributes for easier selection/styling
      li.setAttribute('data-index', item.idx);

      let btnText = "Kaufen";
      if (item.group === "base" && currentLevel > 0) {
          btnText = `Kaufen (${currentLevel})`;
      } else if (isBought) {
          btnText = "Gekauft";
      }


      const button = document.createElement('button');
      button.textContent = btnText;
      button.disabled = locked || isBought; // Disable if locked OR already bought (for non-base)
      button.tabIndex = 0; // Keep for accessibility

      // Use a single handler and determine action based on data attributes
      button.addEventListener("click", () => handleBuyClick(item.group, item.idx));

      // Safer innerHTML construction or use textContent/createElement
      const descDiv = document.createElement('div');
      descDiv.className = 'desc';
      const nameStrong = document.createElement('strong');
      nameStrong.textContent = item.up.name;
      const descSmall = document.createElement('small');
      descSmall.textContent = item.up.desc;
      descDiv.appendChild(nameStrong);
      descDiv.appendChild(document.createElement('br'));
      descDiv.appendChild(descSmall);

      const costDiv = document.createElement('div');
      costDiv.className = 'cost';
      costDiv.textContent = formatAmount(cost);

      li.appendChild(descDiv);
      li.appendChild(costDiv);
      li.appendChild(button);
      ul.appendChild(li);
    }
  }

  function handleBuyClick(group, idx) {
       switch(group) {
           case 'base':
               buyUpgrade(idx);
               break;
           case 'xl':
               buyXLUpgrade(idx);
               break;
           case 'xxl':
               buyXXLUpgrade(idx);
               break;
       }
   }


  function getUpgradeCost(idx) {
    // Ensure index is valid
    if (idx < 0 || idx >= baseUpgradeDefinitions.length) return Infinity;
    const def = baseUpgradeDefinitions[idx];
    const currentLevel = state.upgrades[idx] || 0;
    // Use BigInt if numbers can get extremely large, otherwise stick to Number
    return Math.floor(def.cost * Math.pow(def.costInc, currentLevel));
  }

  function buyUpgrade(idx) {
    const cost = getUpgradeCost(idx);
    if (state.total >= cost) {
      state.total -= cost;
      state.upgrades[idx] = (state.upgrades[idx] || 0) + 1; // Initialize if needed

      const def = baseUpgradeDefinitions[idx];
      if (def.type === "click") {
        // Recalculate total click value based on all click upgrades
        recalculateClickValue();
      } else if (def.type === "auto") {
         // Recalculate total auto rate based on all auto upgrades
        recalculateAutoRate();
      }
      updateCounter();
      updateShop(); // Update shop to show new cost/level
      saveGame();
    }
  }

  function buyXLUpgrade(idx) {
    if (idx < 0 || idx >= xlUpgrades.length || state.xlBought[idx]) return; // Check bounds and if already bought

    const up = xlUpgrades[idx];
    if(state.total >= up.cost) {
        state.total -= up.cost;
        state.xlBought[idx] = true;

        // Handle effects based on type, unless a callback specifically overrides it
        if (up.type === "click" && !up.callback) { // Only apply if no callback handles it
            recalculateClickValue(); // Recalculate needed
        } else if (up.type === "auto" && !up.callback) { // Only apply if no callback handles it
             recalculateAutoRate(); // Recalculate needed
        }
        // Execute callback if it exists
        if (up.callback) {
             up.callback();
        }
        // If the callback modified click/auto values, recalculation might be needed again
        // Or ensure callbacks directly modify the final state correctly.
        // The Superclick callback DOES modify state.clickValue, so we don't recalculate here based on type.

        saveGame();
        updateShop();
        updateCounter();
    }
  }

  function buyXXLUpgrade(idx) {
     if (idx < 0 || idx >= xxlUpgrades.length || state.xxlBought[idx]) return; // Check bounds and if already bought

    const up = xxlUpgrades[idx];
     if(state.total >= up.cost) {
        state.total -= up.cost;
        state.xxlBought[idx] = true;

         // Handle effects based on type
        if (up.type === "click" && !up.callback) {
            recalculateClickValue();
        } else if (up.type === "auto" && !up.callback) {
            state.autoRate += up.value; // Add the direct value for this specific XXL upgrade
            // recalculateAutoRate(); // Or recalculate if multiple XXL auto upgrades exist
        }

        // Execute callback if it exists
        if(up.callback) {
             up.callback();
        }

        // The Maxi-Autoklicker originally had a callback, now handled by type 'auto' + value.
        // Ensure recalculateAutoRate() covers all sources if callbacks are removed.
        // Let's assume Maxi-Autoklicker is the only XXL auto upgrade for now.

        saveGame();
        updateShop();
        updateCounter();
    }
  }

  // Recalculation functions to ensure values are correct after any purchase
 function recalculateClickValue() {
     let newClickValue = 1; // Base click value
     // Add value from base upgrades
     baseUpgradeDefinitions.forEach((def, i) => {
         if (def.type === 'click') {
             newClickValue += (state.upgrades[i] || 0) * def.value;
         }
     });
     // Add value from bought XL upgrades (that affect clicks)
     xlUpgrades.forEach((def, i) => {
         // Check if bought AND if it's a click upgrade (potentially handled by callback)
         // The "Superklick" has a callback, let's rely on that callback mechanism as originally designed.
         // If Superklick callback is removed, logic needs adjustment here.
     });
      // Manually add Superklick if its callback was removed (assuming index 2)
     // if (state.xlBought[2]) newClickValue += 25; // Add this line IF the callback is removed from xlUpgrades[2]


     // Add value from bought XXL upgrades (that affect clicks)
     // (None defined in the original list)
      state.clickValue = newClickValue;

      // Add bonus from "+15" button if that feature is kept separate
      // state.clickValue += currentBonusClickValue; // If tracking bonus separately
 }


function recalculateAutoRate() {
    let newAutoRate = 0;
    // Add value from base upgrades
    baseUpgradeDefinitions.forEach((def, i) => {
        if (def.type === 'auto') {
            newAutoRate += (state.upgrades[i] || 0) * def.value;
        }
    });
     // Add value from bought XL upgrades (that affect auto)
     // (None defined in the original list)

    // Add value from bought XXL upgrades (that affect auto)
    xxlUpgrades.forEach((def, i) => {
        if (state.xxlBought[i] && def.type === 'auto' && def.value) {
             newAutoRate += def.value;
        }
    });

    state.autoRate = newAutoRate;
    state.auto = newAutoRate; // Keep state.auto synced if it's used elsewhere
}


  function updateCounter() {
    const counterElement = document.getElementById("total-pandas");
    if (counterElement) {
        counterElement.textContent = formatAmount(state.total); // Format the display value
    }
    // Maybe update browser title?
    // document.title = `${formatAmount(state.total)} Pandas - Clicker`;
  }

 function formatAmount(val) {
    if (val === null || val === undefined) return '0';
    if (val >= 1e12) return (val / 1e12).toFixed(2) + " T"; // Trillion
    if (val >= 1e9) return (val / 1e9).toFixed(2) + " B";  // Billion (Milliarde)
    if (val >= 1e6) return (val / 1e6).toFixed(2) + " Mio"; // Million
    if (val >= 10000) return (val / 1000).toFixed(1) + "k";   // Thousand
    // Use Intl for locale-specific formatting for smaller numbers
    return Math.floor(val).toLocaleString('de-DE'); // Integer part, German formatting
 }

  // ========== Click/Animation/Autosammeln ===========

  function updateAnimalSVG() {
    const btn = document.getElementById("animal-btn");
    if (!btn) return;

    // Use textContent for emoji for better performance than innerHTML
    const emojiSpan = btn.querySelector(".animal-emoji") || document.createElement('span');
    emojiSpan.className = "animal-emoji"; // Ensure class is set
    emojiSpan.setAttribute("aria-hidden", "true");
    emojiSpan.textContent = animals[state.animal].emoji;

    // Clear previous content and append new/updated span
    btn.innerHTML = ''; // Clear first
    btn.appendChild(emojiSpan);


    btn.setAttribute("aria-label", animals[state.animal].clickLabel);

    // Animation - ensure it doesn't run if element isn't visible or animations disabled
    if (typeof btn.animate === 'function') {
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
  }

  function clickAnimal() {
    state.total += state.clickValue;
    updateCounter();
    // Avoid updating the whole shop on every click for performance.
    // Update only if needed (e.g., if a cost threshold is met)
    // updateShop();
    checkShopAffordability(); // Lighter update check
    saveGame(); // Consider debouncing saveGame if clicks are extremely rapid
    popEffect(state.clickValue); // Pass the value for the pop effect
    playClickSound();
  }

  // Optional: Lighter check than full shop redraw
  function checkShopAffordability() {
      const shopList = document.getElementById("shop-list");
      if (!shopList || shopList.children.length === 0) return; // Only run if shop is open/rendered

      const fullList = getFullShopList();
      for (const item of fullList) {
          let cost = 0;
          let isBought = false;
          let currentLevel = 0; // For base upgrades
          const li = shopList.querySelector(`li[data-group='${item.group}'][data-index='${item.idx}']`);
          if (!li) continue; // Skip if item not found in DOM

          const button = li.querySelector('button');
          if (!button) continue;

          if (item.group === "base") {
              currentLevel = state.upgrades[item.idx] || 0;
              cost = getUpgradeCost(item.idx);
              isBought = false; // Base upgrades are never "bought" in the one-time sense
          } else if (item.group === "xl") {
              cost = item.up.cost;
              isBought = state.xlBought[item.idx] || false;
          } else
