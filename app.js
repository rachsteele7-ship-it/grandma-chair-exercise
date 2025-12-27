(() => {
  const actionLine = document.getElementById('actionLine');
  const progressLine = document.getElementById('progressLine');
  const detailLine = document.getElementById('detailLine');
  const startBtn = document.getElementById('startBtn');

  const SETTINGS = {
    sets: 3,          // 3세트
    repsPerSide: 5,   // 왼쪽 5회 → 오른쪽 5회
    liftSeconds: 5,   // 올리기 5초
    lowerSeconds: 3,  // 내리기(쉬기) 3초
    prepSeconds: 2,   // 세트 시작 전 준비 2초
    voice: true,      // 음성 안내 on/off
  };

  let isRunning = false;

  function setLines(action = '', progress = '', detail = '') {
    actionLine.textContent = action;
    progressLine.textContent = progress;
    detailLine.textContent = detail;
  }

  function canSpeak() {
    return SETTINGS.voice && ('speechSynthesis' in window);
  }

  function speakInstruction(text) {
    if (!canSpeak()) return;
    window.speechSynthesis.cancel(); // 안내 문장은 항상 새로 또렷하게
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ko-KR';
    u.rate = 0.95;
    u.pitch = 1.0;
    u.volume = 1.0;
    window.speechSynthesis.speak(u);
  }

  function speakCount(text) {
    if (!canSpeak()) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ko-KR';
    u.rate = 1.05;
    u.pitch = 1.0;
    u.volume = 1.0;
    window.speechSynthesis.speak(u);
  }

  const KOR = { 5: '다섯', 4: '넷', 3: '셋', 2: '둘', 1: '하나' };

  function delay(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }

  async function countdown(seconds, onTick) {
    for (let s = seconds; s >= 1; s -= 1) {
      onTick(s);
      speakCount(KOR[s] || String(s));
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

    // 올리기
    speakInstruction(`${sideText} 다리 올리세요`);
    await countdown(SETTINGS.liftSeconds, (s) => {
      setLines(
        `${sideText} 다리 올리세요`,
        `${setText} · ${repText}`,
        `${s}초`
      );
    });

    // 내리기
    speakInstruction(`${sideText} 다리 내리세요`);
    await countdown(SETTINGS.lowerSeconds, (s) => {
      setLines(
        `${sideText} 다리 내리세요`,
        `${setText} · ${repText}`,
        `${s}초`
      );
    });
  }

  async function doSide({ setNo, side }) {
    for (let rep = 1; rep <= SETTINGS.repsPerSide; rep += 1) {
      await doOneRep({ setNo, side, repNo: rep });
    }
  }

  async function doSet(setNo) {
    const prepMsg = `${setNo}세트 시작합니다. 준비하세요.`;
    speakInstruction(prepMsg);

    await countdown(SETTINGS.prepSeconds, (s) => {
      setLines(prepMsg, '', `${s}초`);
    });

    await doSide({ setNo, side: 'L' });
    await doSide({ setNo, side: 'R' });

    if (setNo < SETTINGS.sets) {
      const doneMsg = `${setNo}세트 완료하셨습니다.`;
      setLines(doneMsg, '', `${setNo + 1}세트 준비`);
      speakInstruction(`${doneMsg} ${setNo + 1}세트 시작합니다. 준비하세요.`);
      await delay(800);
    } else {
      setLines('오늘 운동 완료! 👍', '', '오늘도 수고하셨어요');
      speakInstruction('오늘 운동 완료! 오늘도 수고하셨어요');
    }
  }

  async function startExercise() {
    if (isRunning) return;
    isRunning = true;

    startBtn.disabled = true;
    startBtn.textContent = '진행 중...';

    try {
      for (let setNo = 1; setNo <= SETTINGS.sets; setNo += 1) {
        await doSet(setNo);
      }
      startBtn.textContent = '다시 시작';
    } finally {
      startBtn.disabled = false;
      isRunning = false;
    }
  }

  // 초기 화면
  setLines('버튼을 눌러 운동을 시작하세요', '', '');
  startBtn.addEventListener('click', startExercise);
})();
