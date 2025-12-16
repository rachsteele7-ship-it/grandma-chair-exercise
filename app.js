const messageEl = document.getElementById("message");
const startBtn = document.getElementById("startBtn");

const delay = (ms) => new Promise((r) => setTimeout(r, ms));
const totalReps = 10;

let isRunning = false;

function setMessage(text) {
  messageEl.textContent = text;
}

async function runLegSet(side) {
  for (let i = 1; i <= totalReps; i += 1) {
    setMessage(`${side} 다리 5초 올리세요 (${i}/${totalReps})`);
    await delay(5000);
  }
}

async function startExercise() {
  if (isRunning) return;

  isRunning = true;
  startBtn.disabled = true;
  startBtn.textContent = "진행 중…";

  await runLegSet("왼쪽");
  await runLegSet("오른쪽");

  setMessage("오늘 운동 완료! 👍");
  startBtn.disabled = false;
  startBtn.textContent = "다시 시작";
  isRunning = false;
}

setMessage("버튼을 눌러 운동을 시작하세요");
startBtn.addEventListener("click", startExercise);
