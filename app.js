const messageEl = document.getElementById("message");
const startBtn = document.getElementById("startBtn");

const SETS = 3;
const REPS_PER_SIDE = 5;
const LIFT_SECONDS = 5;
const LOWER_REST_SECONDS = 2;
const REST_BETWEEN_SETS_SECONDS = 3;

let running = false;

function speak(text) {
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "ko-KR";
  speechSynthesis.cancel();
  speechSynthesis.speak(u);
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function countLift(side, setNo, repNo) {
  speak(`${side} 다리 올리세요`);
  for (let i = LIFT_SECONDS; i >= 1; i--) {
    messageEl.textContent =
      `${side} 다리 올리세요\n` +
      `세트 ${setNo}/${SETS} · ${repNo}/${REPS_PER_SIDE}\n` +
      `${i}초`;
    speak(["하나", "둘", "셋", "넷", "다섯"][LIFT_SECONDS - i]);
    await sleep(1000);
  }
}

async function lower(side) {
  messageEl.textContent = `${side} 다리 내리세요`;
  speak("내리세요");
  await sleep(LOWER_REST_SECONDS * 1000);
}

async function runSide(side, setNo) {
  for (let r = 1; r <= REPS_PER_SIDE; r++) {
    await countLift(side, setNo, r);
    await lower(side);
  }
}

async function startExercise() {
  if (running) return;
  running = true;

  startBtn.disabled = true;
  startBtn.textContent = "진행 중…";

  for (let s = 1; s <= SETS; s++) {
    await runSide("왼쪽", s);
    await runSide("오른쪽", s);

    if (s < SETS) {
      messageEl.textContent = `${s}세트 완료!\n${s + 1}세트 시작`;
      speak(`${s}세트 완료하셨습니다. ${s + 1}세트 시작`);
      await sleep(REST_BETWEEN_SETS_SECONDS * 1000);
    }
  }

  messageEl.textContent = "오늘 운동 완료! 👍";
  speak("오늘 운동 완료하셨습니다");

  startBtn.textContent = "다시 시작";
  startBtn.disabled = false;
  running = false;
}

messageEl.textContent = "버튼을 눌러 운동을 시작하세요";
startBtn.addEventListener("click", startExercise);
