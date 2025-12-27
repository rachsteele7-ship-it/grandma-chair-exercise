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
    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text);
      Object.assign(utterance, {
        lang: 'ko-KR',
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
    
    const { utterance, resolve } = speechQueue.shift();
    window.speechSynthesis.cancel();
    currentUtterance = utterance;
    window.speechSynthesis.speak(utterance);
  }

  const KOR = { 5: '다섯', 4: '넷', 3: '셋', 2: '둘', 1: '하나' };

  function delay(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

  async function syncedCountdown(seconds, onTick, speakType = 'count') {
    for (let s = seconds; s >= 1; s -= 1) {
      onTick(s);
      
      if (speakType === 'count') {
        await queueSpeech(KOR[s] || String(s), { rate: 1.05 });
      }
      
      await delay(1000);
    }
  }

  function sideLabel(side) {
    return side === 'L' ? '왼쪽' : '오른쪽';
  }

  async function doOneRep({ setNo, side, repNo }) {
    const sideText = sideLabel(side);
    const setText = `${setNo}/${SETTINGS.sets}세트`;
    const repText = `${repNo}/${SETTINGS.repsPerSide}회`;

    // 올리기 (카운트 있음)
    await queueSpeech(`${sideText} 다리 올리세요`);
    await syncedCountdown(SETTINGS.liftSeconds, (s) => {
      setLines(`${sideText} 다리 올리세요`, `${setText} · ${repText}`, `${s}초`);
    });

    // 내리기 (카운트 없음, 조용히 쉬기)
    await queueSpeech(`${sideText} 다리 내리세요`);
    for (let s = SETTINGS.lowerSeconds; s >= 1; s -= 1) {
      setLines(`${sideText} 다리 내리세요`, `${setText} · ${repText}`, `${s}초`);
      await delay(1000);
    }
  }

  async function doSide({ setNo, side }) {
    for (let rep = 1; rep <= SETTINGS.repsPerSide; rep++) {
      await doOneRep({ setNo, side, repNo: rep });
    }
  }

  async function doSet(setNo) {
    const prepMsg = `${setNo}세트 시작합니다. 준비하세요.`;
    await queueSpeech(prepMsg);

    await syncedCountdown(SETTINGS.prepSeconds, (s) => {
      setLines(prepMsg, '', `${s}초`);
    }, 'prep'); // 카운트 음성 없음

    await doSide({ setNo, side: 'L' });
    await doSide({ setNo, side: 'R' });

    if (setNo < SETTINGS.sets) {
      const doneMsg = `${setNo}세트 완료. ${setNo + 1}세트 준비하세요`;
      setLines(doneMsg, '', '');
      await queueSpeech(doneMsg);
      await delay(1000);
    } else {
      const finishMsg = '오늘 운동 완료! 수고하셨습니다 👍';
      setLines(finishMsg, '', '잘하셨어요!');
      await queueSpeech(finishMsg);
    }
  }

  async function startExercise() {
    if (isRunning) return;
    isRunning = true;

    startBtn.disabled = true;
    startBtn.textContent = '진행 중...';

    try {
      for (let setNo = 1; setNo <= SETTINGS.sets; setNo++) {
        await doSet(setNo);
      }
      startBtn.textContent = '다시 시작';
    } finally {
      startBtn.disabled = false;
      isRunning = false;
      speechQueue = [];
    }
  }

  setLines('버튼을 눌러 운동을 시작하세요', '', '');
  startBtn.addEventListener('click', startExercise);
})();
