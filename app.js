// 🔄 freeze 방지 (원본 방식)
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

  const KOR = { 1: '하나', 2: '둘', 3: '셋', 4: '넷', 5: '다섯' };

  function delay(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

  async function syncedCountdown(seconds, onTick, speakType = 'count') {
    for (let s = 1; s <= seconds; s += 1) {
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

    setLines(`${sideText} 다리 올리세요`, `${setText} · ${repText}`, `1초`);
    await queueSpeech(`${sideText} 다리 올리세요`);
    
    await syncedCountdown(SETTINGS.liftSeconds, (s) => {
      setLines(`${sideText} 다리 올리세요`, `${setText} · ${repText}`, `${s}초`);
    });

    setLines(`${sideText} 다리 내리세요`, `${setText} · ${repText}`, `${SETTINGS.lowerSeconds}초`);
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
    setLines(prepMsg, '', `1초`);
    await queueSpeech(prepMsg);

    await syncedCountdown(SETTINGS.prepSeconds, (s) => {
      setLines(prepMsg, '', `${s}초`);
    }, 'prep');

    await doSide({ setNo, side: 'L' });
    await doSide({ setNo, side: 'R' });

    if (setNo < SETTINGS.sets) {
      const nextSet = setNo + 1;
      const doneMsg = `${setNo}번째 세트 완료. ${nextSet}번째 세트 준비합니다.`;
      setLines(doneMsg, '', '');
      await queueSpeech(doneMsg);
      await delay(1000);
    } else {
      const finishMsg = '오늘 운동 완료! 수고하셨습니다';
      const displayMsg = finishMsg + ' 👍';
      
      setLines(displayMsg, '', '잘하셨어요!');
      await queueSpeech(finishMsg);
    }
  }

  async function startExercise() {
    if (isRunning) return;
    isRunning = true;

    startBtn.disabled = true;
    startBtn.textContent = '진행 중...';

    try {
      const postureMsg = '의자에 엉덩이 완전히 붙이고 등 곧게 펴고 앉으세요';
      setLines(postureMsg, '', '준비 5초');
      await queueSpeech(postureMsg);
      
      await syncedCountdown(5, (s) => {
        setLines(postureMsg, '', `${s}초`);
      }, 'prep');

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
