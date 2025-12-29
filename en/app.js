// 🔄 Auto reset system (for simple use)
window.addEventListener('load', function() {
  localStorage.clear();
  sessionStorage.clear();
});

document.addEventListener('visibilitychange', function() {
  if (!document.hidden) {
    localStorage.clear();
    sessionStorage.clear();
    location.reload();
  }
});

window.addEventListener('beforeunload', function() {
  localStorage.clear();
});

(() => {
  const actionLine = document.getElementById('actionLine');
  const progressLine = document.getElementById('progressLine');
  const detailLine = document.getElementById('detailLine');
  const startBtn = document.getElementById('startBtn');

  const SETTINGS = {
    sets: 3,
    repsPerSide: 5,
    liftSeconds: 5,
    lowerSeconds: 3,
    prepSeconds: 2,
    voice: true,
  };

  let isRunning = false;
  let speechQueue = [];
  let currentUtterance = null;

  function setLines(action = '', progress = '', detail = '') {
    actionLine.textContent = action;
    progressLine.textContent = progress;
    detailLine.textContent = detail;
  }

  function canSpeak() {
    return SETTINGS.voice && ('speechSynthesis' in window);
  }

  function queueSpeech(text, options = {}) {
    // If voice is off / unsupported, keep timing behaviour consistent.
    if (!canSpeak()) return Promise.resolve();

    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text);
      Object.assign(utterance, {
        lang: 'en-GB',
        rate: options.rate || 0.95,
        pitch: 1.0,
        volume: 1.0,
        ...options
      });

      utterance.onend = () => {
        currentUtterance = null;
        resolve();
      };

      speechQueue.push({ utterance, resolve });
      processQueue();
    });
  }

  function processQueue() {
    if (currentUtterance || speechQueue.length === 0) return;

    const { utterance } = speechQueue.shift();
    window.speechSynthesis.cancel();
    currentUtterance = utterance;
    window.speechSynthesis.speak(utterance);
  }

  function delay(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

  // Synced count up (1 → seconds)
  async function syncedCountdown(seconds, onTick, speakType = 'count') {
    for (let s = 1; s <= seconds; s += 1) {
      onTick(s); // screen: 1 → 2 → 3 → 4 → 5

      if (speakType === 'count') {
        await queueSpeech(String(s), { rate: 1.05 });
      }

      await delay(1000);
    }
  }

  function sideLabel(side) {
    return side === 'L' ? 'Left' : 'Right';
  }

  async function doOneRep({ setNo, side, repNo }) {
    const sideText = sideLabel(side);
    const setText = `Set ${setNo} of ${SETTINGS.sets}`;
    const repText = `Rep ${repNo} of ${SETTINGS.repsPerSide}`;

    // Lift: UI first + voice
    setLines(`${sideText} leg up`, `${setText} · ${repText}`, `1 s`);
    await queueSpeech(`${sideText} leg up`);

    await syncedCountdown(SETTINGS.liftSeconds, (s) => {
      setLines(`${sideText} leg up`, `${setText} · ${repText}`, `${s} s`);
    });

    // Lower: UI first + voice (no spoken count)
    setLines(`${sideText} leg down`, `${setText} · ${repText}`, `${SETTINGS.lowerSeconds} s`);
    await queueSpeech(`${sideText} leg down`);

    for (let s = SETTINGS.lowerSeconds; s >= 1; s -= 1) {
      setLines(`${sideText} leg down`, `${setText} · ${repText}`, `${s} s`);
      await delay(1000);
    }
  }

  async function doSide({ setNo, side }) {
    for (let rep = 1; rep <= SETTINGS.repsPerSide; rep++) {
      await doOneRep({ setNo, side, repNo: rep });
    }
  }

  async function doSet(setNo) {
    const prepMsg = `Starting set ${setNo}. Get ready.`;
    setLines(prepMsg, '', `1 s`);
    await queueSpeech(prepMsg);

    await syncedCountdown(SETTINGS.prepSeconds, (s) => {
      setLines(prepMsg, '', `${s} s`);
    }, 'prep');

    await doSide({ setNo, side: 'L' });
    await doSide({ setNo, side: 'R' });

    if (setNo < SETTINGS.sets) {
      const nextSet = setNo + 1;
      const doneMsg = `Set ${setNo} complete. Get ready for set ${nextSet}.`;
      setLines(doneMsg, '', '');
      await queueSpeech(doneMsg);
      await delay(1000);
    } else {
      // Keep emoji off TTS
      const finishMsg = 'Workout complete. Well done.';
      const displayMsg = finishMsg + ' 👍';

      setLines(displayMsg, '', 'Great job!');
      await queueSpeech(finishMsg);
    }
  }

  async function startExercise() {
    if (isRunning) return;
    isRunning = true;

    startBtn.disabled = true;
    startBtn.textContent = 'In progress…';

    try {
      const postureMsg = 'Sit tall on the chair. Keep your back straight.';
      setLines(postureMsg, '', 'Get ready: 5 s');
      await queueSpeech(postureMsg);

      await syncedCountdown(5, (s) => {
        setLines(postureMsg, '', `${s} s`);
      }, 'prep');

      for (let setNo = 1; setNo <= SETTINGS.sets; setNo++) {
        await doSet(setNo);
      }

      startBtn.textContent = 'Start again';
    } finally {
      startBtn.disabled = false;
      isRunning = false;
      speechQueue = [];
    }
  }

  setLines('Press the button to start.', '', '');
  startBtn.addEventListener('click', startExercise);
})();
