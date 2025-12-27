(() => {
  const actionLine = document.getElementById('actionLine');
  const progressLine = document.getElementById('progressLine');
  const detailLine = document.getElementById('detailLine');
  const startBtn = document.getElementById('startBtn');

  // 요소가 없으면 바로 중단 (조용히 실패하는 것 방지)
  if (!actionLine || !progressLine || !detailLine || !startBtn) {
    console.error('필수 요소가 없습니다. index.html의 id들을 확인하세요.');
    return;
  }

  const SETTINGS = {
    sets: 3,          // 3세트
    repsPerSide: 5,   // 왼쪽 5회 → 오른쪽 5회
    liftSeconds: 5,   // 올리기 5초
    lowerSeconds: 3,  // 내리기 3초
    prepSeconds: 2,   // 세트 시작 전 준비 2초
    voice: true,      // 음성 안내 on/off
  };

  let isRunning = false;

  function setLines(action, progress, detail) {
    actionLine.textContent = action ?? '';
    progressLine.textContent = progress ?? '';
    detailLine.textContent = detail ?? '';
  }

  // ---- 음성 ----
  function speakInstruction(text) {
    if (!SETTINGS.voice) return;
    if (!('speechSynthesis' in window)) return;

    // 안내 문장은 확실히 새로 시작 (이전 발화 정리)
    window.speechSynthesis.cancel();

    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ko-KR';
    u.rate = 0.95;
    u.pitch = 1.0;
    u.volume = 1.0;
    window.speechSynthesis.speak(u);
  }

  function speakCount(text) {
    if (!SETTINGS.voice) return;
    if (!('speechSynthesis' in window)) return;

    // 카운트는 cancel하지 않음 (안내 문장 끊지 않게)
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ko-KR';
    u.rate = 1.05;
    u.pitch = 1.0;
    u.volume = 1.0;
    window.speechSynthesis.speak(u);
  }

  function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function countdown(seconds, onTick) {
    const kor = { 5: '다섯', 4: '넷', 3: '셋', 2: '둘', 1: '하나' };
    for (let s = seconds; s >= 1; s -= 1) {
      onTick(s);
      speakCount(kor[s] || String(s));
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

    // 1) 올리기
    speakInstruction(`${sideText} 다리 올리세요`);
    await countdown(SETTINGS.liftSeconds, (s) => {
      setLines(
        `${sideText} 다리 올리세요`,
        `${setText} · ${repText}`,
        `${s}초`
      );
    });

    // 2) 내리기
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
    // 세트 시작 안내
    const startMsg = `${setNo}세트 시작합니다. 준비하세요.`;
    speakInstruction(startMsg);

    await countdown(SETTINGS.prepSeconds, (s) => {
      setLines(startMsg, '', `${s}초`);
    });

    // 왼쪽 → 오른쪽
    await doSide({ setNo, side: 'L' });
    await doSide({ setNo, side: 'R' });

    // 세트 종료 안내
    if (setNo < SETTINGS.sets) {
      const doneMsg = `${setNo}세트 완료하셨습니다.`;
      const nextMsg = `${setNo + 1}세트 시작합니다. 준비하세요.`;
      setLines(doneMsg, '', '');
      speakInstruction(`${doneMsg} ${nextMsg}`);
      await delay(800);
    } else {
      setLines(`오늘 운동 완료! 👍`, '', `오늘도 수고하셨어요`);
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
