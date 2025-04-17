document.addEventListener('DOMContentLoaded', () => {
  let clickCount = 0;
  let autoClickerCount = 0;
  let superAutoClickerCount = 0;
  let isAdmin = false;
  let clickMultiplier = 1;
  let pandaEmpireMultiplier = 1;
  let nextBonusThreshold = 10;
  let currentClickerType = "panda"; // Standardmäßig Panda Clicker

  // SVG-Grafiken für Panda und Katze
  const pandaSVG = `<svg id="clicker" viewBox="0 0 200 200" width="200" height="200">
    <circle cx="100" cy="100" r="80" fill="white" stroke="black" stroke-width="4"/>
    <circle cx="50" cy="40" r="20" fill="black"/>
    <circle cx="150" cy="40" r="20" fill="black"/>
    <ellipse cx="70" cy="90" rx="18" ry="25" fill="black"/>
    <ellipse cx="130" cy="90" rx="18" ry="25" fill="black"/>
    <circle cx="70" cy="90" r="7" fill="white"/>
    <circle cx="130" cy="90" r="7" fill="white"/>
    <path d="M90 120 Q100 130 110 120" stroke="black" stroke-width="3" fill="none"/>
  </svg>`;
  
  const catSVG = `<svg id="clicker" viewBox="0 0 200 200" width="200" height="200">
    <circle cx="100" cy="100" r="80" fill="#FFA07A" stroke="black" stroke-width="4"/>
    <!-- Ohren -->
    <polygon points="50,60 70,20 90,60" fill="#FFA07A" stroke="black" stroke-width="3"/>
    <polygon points="110,60 130,20 150,60" fill="#FFA07A" stroke="black" stroke-width="3"/>
    <!-- Augen -->
    <circle cx="70" cy="90" r="10" fill="white"/>
    <circle cx="130" cy="90" r="10" fill="white"/>
    <circle cx="70" cy="90" r="4" fill="black"/>
    <circle cx="130" cy="90" r="4" fill="black"/>
    <!-- Nase -->
    <circle cx="100" cy="110" r="5" fill="pink"/>
    <!-- Mund -->
    <path d="M90 120 Q100 130 110 120" stroke="black" stroke-width="2" fill="none"/>
    <!-- Schnurrhaare -->
    <line x1="40" y1="100" x2="70" y2="100" stroke="black" stroke-width="2"/>
    <line x1="40" y1="110" x2="70" y2="110" stroke="black" stroke-width="2"/>
    <line x1="40" y1="90" x2="70" y2="90" stroke="black" stroke-width="2"/>
    <line x1="130" y1="100" x2="160" y2="100" stroke="black" stroke-width="2"/>
    <line x1="130" y1="110" x2="160" y2="110" stroke="black" stroke-width="2"/>
    <line x1="130" y1="90" x2="160" y2="90" stroke="black" stroke-width="2"/>
  </svg>`;
  
  function updateClickerSVG() {
    const container = document.getElementById('clicker-container');
    if (!container) return;
    container.innerHTML = (currentClickerType === "panda") ? pandaSVG : catSVG;
    const clickerElem = document.getElementById('clicker');
    if (clickerElem) {
      clickerElem.addEventListener('click', () => {
        handleClickerClick(false);
      });
    }
  }
  
  // Multiplayer Variablen und Initialisierung
  let room;
  let multiplayerScores = {};

  function updateScoreboardUI() {
    const scoreboardList = document.getElementById('scoreboard-list');
    if (!scoreboardList) return;
    scoreboardList.innerHTML = '';
    const players = {};
    players[room.party.client.id] = {
      username: room.party.client.username || "Ich",
      avatarUrl: room.party.client.avatarUrl || `https://images.websim.ai/avatar/${room.party.client.username}`
    };
    for (const clientId in room.party.peers) {
      players[clientId] = {
        username: room.party.peers[clientId].username,
        avatarUrl: room.party.peers[clientId].avatarUrl || `https://images.websim.ai/avatar/${room.party.peers[clientId].username}`
      };
    }
    for (const clientId in players) {
      const player = players[clientId];
      const score = multiplayerScores[clientId] || (clientId === room.party.client.id ? clickCount : 0);
      const li = document.createElement('li');
      li.innerHTML = `<img src="https://images.websim.ai/avatar/${player.username}" alt="${player.username}" width="24" height="24" style="border-radius:50%;"><span>${player.username}: ${score}</span>`;
      if (clientId === room.party.client.id) {
        li.style.fontWeight = 'bold';
      }
      scoreboardList.appendChild(li);
    }
  }

  function initRoom(joinCode) {
    if (room && room.close) {
      room.close();
    }
    if (joinCode) {
      room = new WebsimSocket({ roomId: joinCode });
    } else {
      room = new WebsimSocket();
    }
    multiplayerScores = {};

    room.onmessage = (event) => {
      const data = event.data;
      switch(data.type) {
        case "updateScore":
          multiplayerScores[data.clientId] = data.score;
          updateScoreboardUI();
          break;
        case "connected":
          updateScoreboardUI();
          break;
        case "disconnected":
          delete multiplayerScores[data.clientId];
          updateScoreboardUI();
          break;
        default:
          console.log("Received event:", data);
      }
    };

    room.party.subscribe((peers) => {
      updateScoreboardUI();
    });

    const currentRoomCodeSpan = document.getElementById('current-room-code');
    if (currentRoomCodeSpan) {
      currentRoomCodeSpan.textContent = joinCode || "default";
    }
    updateScoreboardUI();
  }

  initRoom();

  const joinRoomButton = document.getElementById('join-room-button');
  if (joinRoomButton) {
    joinRoomButton.addEventListener('click', () => {
      const joinCodeInput = document.getElementById('join-code-input');
      const code = joinCodeInput.value.trim();
      if (code) {
        initRoom(code);
        alert("Du bist dem Raum " + code + " beigetreten!");
        settingsModal.classList.add('hidden');
      } else {
        alert("Bitte gib einen gültigen Raum-Code ein.");
      }
    });
  }

  let audioContext = null;
  let currentMusicNotes = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 392.00, 349.23];

  function playClickSound() {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
    gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.1);
  }

  function playBonusSound() {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.2);
  }

  function playThunderSound() {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(100, audioContext.currentTime);
    gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.3);
  }
  
  function showCoinDeduction(amount) {
    const coinElement = document.createElement('div');
    coinElement.classList.add('coin-change');
    coinElement.textContent = amount;
    coinElement.style.color = amount < 0 ? 'red' : 'green';
    document.getElementById('counter-container').appendChild(coinElement);
    coinElement.addEventListener('animationend', () => coinElement.remove());
  }

  function handleClickerClick(auto = false) {
    const clickerElem = document.getElementById('clicker');
    const increment = auto ? 1 : clickMultiplier * pandaEmpireMultiplier;
    clickCount += increment;
    document.getElementById('counter').textContent = clickCount;
    if (!auto) {
      playClickSound();
      if(clickerElem){
        clickerElem.classList.add('clicked');
        setTimeout(() => {
          clickerElem.classList.remove('clicked');
        }, 150);
      }
    }
    while (clickCount >= nextBonusThreshold) {
      const bonusPoints = 5;
      clickCount += bonusPoints;
      document.getElementById('counter').textContent = clickCount;
      if (!auto) {
        playBonusSound();
        const bonusText = document.createElement('div');
        bonusText.id = 'bonus-text';
        bonusText.textContent = `Bonus +${bonusPoints}!`;
        const container = document.getElementById('clicker-container');
        container.appendChild(bonusText);
        bonusText.addEventListener('animationend', () => bonusText.remove());
      }
      nextBonusThreshold += 10;
    }
    multiplayerScores[room.party.client.id] = clickCount;
    room.send({ type: "updateScore", score: clickCount });
    updateScoreboardUI();
  }

  updateClickerSVG();

  const settingsModal = document.getElementById('settings-modal');
  const settingsButton = document.getElementById('settings-button');
  const modalClose = document.getElementById('modal-close');
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');

  settingsButton.addEventListener('click', () => {
    settingsModal.classList.remove('hidden');
  });

  modalClose.addEventListener('click', () => {
    settingsModal.classList.add('hidden');
  });

  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const targetTab = button.getAttribute('data-tab');
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));
      button.classList.add('active');
      document.getElementById(targetTab).classList.add('active');
    });
  });

  const pandaChoiceButton = document.getElementById('panda-choice');
  const catChoiceButton = document.getElementById('cat-choice');
  if (pandaChoiceButton) {
    pandaChoiceButton.addEventListener('click', () => {
      currentClickerType = "panda";
      updateClickerSVG();
      alert('Panda Clicker ausgewählt!');
    });
  }
  if (catChoiceButton) {
    catChoiceButton.addEventListener('click', () => {
      currentClickerType = "cat";
      updateClickerSVG();
      alert('Katzen Clicker ausgewählt!');
    });
  }

  const adminPinInput = document.getElementById('admin-pin-input');
  const adminPinSubmit = document.getElementById('admin-pin-submit');
  const adminError = document.getElementById('admin-error');
  const adminLoginDiv = document.getElementById('admin-login');
  const adminControlsDiv = document.getElementById('admin-controls');
  const adminAddCoinsButton = document.getElementById('admin-add-coins');

  adminPinSubmit.addEventListener('click', () => {
    const pin = adminPinInput.value;
    if (pin === '1234') {
      isAdmin = true;
      adminError.textContent = '';
      adminLoginDiv.style.display = 'none';
      adminControlsDiv.style.display = 'block';
      document.querySelectorAll('.shop-item.admin-only').forEach(item => {
        item.style.display = 'flex';
      });
    } else {
      adminError.textContent = 'Falscher PIN!';
    }
  });

  adminAddCoinsButton.addEventListener('click', () => {
    clickCount += 100;
    document.getElementById('counter').textContent = clickCount;
    multiplayerScores[room.party.client.id] = clickCount;
    room.send({ type: "updateScore", score: clickCount });
    updateScoreboardUI();
  });

  const buyButtons = document.querySelectorAll('.buy-button');
  buyButtons.forEach(button => {
    button.addEventListener('click', () => {
      const item = button.getAttribute('data-item');
      if (item === 'autoClicker') {
        if (clickCount >= 50) {
          clickCount -= 50;
          document.getElementById('counter').textContent = clickCount;
          showCoinDeduction(-50);
          autoClickerCount++;
          alert('Auto Clicker gekauft!');
        } else {
          alert('Nicht genügend Münzen!');
        }
      } else if (item === 'superAutoClicker') {
        if (clickCount >= 200) {
          clickCount -= 200;
          document.getElementById('counter').textContent = clickCount;
          showCoinDeduction(-200);
          superAutoClickerCount++;
          alert('Super Auto Clicker gekauft!');
        } else {
          alert('Nicht genügend Münzen!');
        }
      } else if (item === 'clickBooster') {
        if (clickCount >= 100) {
          clickCount -= 100;
          document.getElementById('counter').textContent = clickCount;
          showCoinDeduction(-100);
          clickMultiplier = 2;
          alert('Click Booster aktiviert! Deine Klicks sind für 30 Sekunden verdoppelt.');
          setTimeout(() => {
            clickMultiplier = 1;
            alert('Click Booster ist abgelaufen.');
          }, 30000);
        } else {
          alert('Nicht genügend Münzen!');
        }
      } else if (item === 'jazzMusic') {
        if (clickCount >= 150) {
          clickCount -= 150;
          document.getElementById('counter').textContent = clickCount;
          showCoinDeduction(-150);
          currentMusicNotes = [261.63, 311.13, 349.23, 392.00, 440.00, 523.25];
          alert('Jazz Background Music aktiviert!');
          if (backgroundMusicPlaying) {
            if (backgroundMusicOscillator) {
              clearInterval(backgroundMusicOscillator.intervalId);
              backgroundMusicOscillator.stop();
            }
            backgroundMusicOscillator = startBackgroundMusic();
          }
        } else {
          alert('Nicht genügend Münzen!');
        }
      } else if (item === 'rockMusic') {
        if (clickCount >= 250) {
          clickCount -= 250;
          document.getElementById('counter').textContent = clickCount;
          showCoinDeduction(-250);
          currentMusicNotes = [329.63, 392.00, 440.00, 493.88, 523.25, 587.33, 659.25, 698.46];
          alert('Rock Background Music aktiviert!');
          if (backgroundMusicPlaying) {
            if (backgroundMusicOscillator) {
              clearInterval(backgroundMusicOscillator.intervalId);
              backgroundMusicOscillator.stop();
            }
            backgroundMusicOscillator = startBackgroundMusic();
          }
        } else {
          alert('Nicht genügend Münzen!');
        }
      } else if (item === 'thunderStrike') {
        if (clickCount >= 500) {
          clickCount -= 500;
          document.getElementById('counter').textContent = clickCount;
          showCoinDeduction(-500);
          alert('Thunder Strike aktiviert! Bonus +200 Münzen!');
          clickCount += 200;
          document.getElementById('counter').textContent = clickCount;
          playThunderSound();
        } else {
          alert('Nicht genügend Münzen!');
        }
      } else if (item === 'ultraBoost') {
        if (clickCount >= 800) {
          clickCount -= 800;
          document.getElementById('counter').textContent = clickCount;
          showCoinDeduction(-800);
          clickMultiplier = 5;
          alert('Ultra Boost aktiviert! Deine Klicks sind für 10 Sekunden verfünffacht!');
          setTimeout(() => {
            clickMultiplier = 1;
            alert('Ultra Boost ist abgelaufen.');
          }, 10000);
        } else {
          alert('Nicht genügend Münzen!');
        }
      } else if (item === 'pandaEmpire') {
        if (clickCount >= 1000) {
          clickCount -= 1000;
          document.getElementById('counter').textContent = clickCount;
          showCoinDeduction(-1000);
          pandaEmpireMultiplier += 1;
          alert('Panda Empire aktiviert! Deine Klicks sind jetzt dauerhaft stärker.');
        } else {
          alert('Nicht genügend Münzen!');
        }
      }
      multiplayerScores[room.party.client.id] = clickCount;
      room.send({ type: "updateScore", score: clickCount });
      updateScoreboardUI();
    });
  });

  setInterval(() => {
    if (autoClickerCount > 0) {
      for (let i = 0; i < autoClickerCount; i++) {
        handleClickerClick(true);
      }
    }
  }, 2000);

  setInterval(() => {
    if (superAutoClickerCount > 0) {
      for (let i = 0; i < superAutoClickerCount; i++) {
        handleClickerClick(true);
      }
    }
  }, 1000);

  const musicToggleButton = document.getElementById('music-toggle');
  let backgroundMusicPlaying = false;
  let backgroundMusicOscillator = null;

  function startBackgroundMusic() {
    const osc = audioContext.createOscillator();
    osc.type = 'sine';
    const gain = audioContext.createGain();
    gain.gain.value = 0.1;
    osc.connect(gain);
    gain.connect(audioContext.destination);
    let notes = currentMusicNotes;
    let noteIndex = 0;
    osc.frequency.setValueAtTime(notes[noteIndex], audioContext.currentTime);
    osc.start();
    const intervalId = setInterval(() => {
      if (!backgroundMusicPlaying) {
        clearInterval(intervalId);
        return;
      }
      noteIndex = (noteIndex + 1) % notes.length;
      osc.frequency.setValueAtTime(notes[noteIndex], audioContext.currentTime);
    }, 500);
    osc.intervalId = intervalId;
    return osc;
  }

  musicToggleButton.addEventListener('click', () => {
    backgroundMusicPlaying = !backgroundMusicPlaying;
    if (backgroundMusicPlaying) {
      if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }
      backgroundMusicOscillator = startBackgroundMusic();
      musicToggleButton.classList.add('active');
    } else {
      if (backgroundMusicOscillator) {
        clearInterval(backgroundMusicOscillator.intervalId);
        backgroundMusicOscillator.stop();
        backgroundMusicOscillator = null;
      }
      musicToggleButton.classList.remove('active');
    }
  });
});