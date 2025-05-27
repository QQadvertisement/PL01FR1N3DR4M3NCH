import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const supabase = createClient(
  'https://nbevrkrmfotibeuhrtzq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5iZXZya3JtZm90aWJldWhydHpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcxNzY5ODcsImV4cCI6MjA2Mjc1Mjk4N30.tJck5rndFMVcwZFeRCy8zTAuXfcxDSxB6MszOZUpSwg'
);

// Game state
let score = 0;
let timer = 10;
let countdown;
let countdownTimer;
let gameEnded = false;

let player = { name: "", phone: "", email: "" };

// Scene switching
const scenes = {
  start: document.getElementById("scene-start"),
  register: document.getElementById("scene-register"),
  tutorial: document.getElementById("scene-tutorial"),
  game: document.getElementById("scene-game"),
  result: document.getElementById("scene-result"),
  survey: document.getElementById("scene-survey"),
  feedback: document.getElementById("scene-feedback"),
};

function showScene(scene) {
  Object.values(scenes).forEach(s => s.classList.add("hidden"));
  scenes[scene].classList.remove("hidden");
}

// 🎬 Start screen → Register
document.getElementById("scene-start").addEventListener("click", () => {
  showScene("register");
});

// 📝 Register → Tutorial
document.getElementById("register-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = new FormData(e.target);
  player.name = form.get("name");
  player.phone = form.get("phone");
  player.email = form.get("email");

  showScene("tutorial");

  document.getElementById("tutorial-countdown").textContent = "Game starting in 3...";
  document.getElementById("tutorial-countdown").classList.add("hidden");
  document.getElementById("ready-btn").classList.remove("hidden");
});

// ✅ "I'm Ready!" triggers countdown
document.getElementById("ready-btn").addEventListener("click", () => {
  let countdownVal = 3;
  const tutorialText = document.getElementById("tutorial-countdown");

  tutorialText.classList.remove("hidden");
  document.getElementById("ready-btn").classList.add("hidden");
  tutorialText.textContent = `Game starting in ${countdownVal}...`;

  countdownTimer = setInterval(() => {
    countdownVal--;
    tutorialText.textContent = `Game starting in ${countdownVal}...`;
    if (countdownVal <= 0) {
      clearInterval(countdownTimer);
      startGame();
    }
  }, 1000);
});

function startGame() {
  score = 0;
  timer = 10;
  gameEnded = false;

  document.getElementById("score").textContent = "Score: 0";
  document.getElementById("progress-bar").style.width = "100%";
  document.getElementById("tap-area").style.pointerEvents = "auto"; // re-enable taps

  const sprite = document.getElementById("sprite");
  if (sprite) {
    sprite.src = "assets/1.png";
    sprite.classList.remove("bounce");
  }

  showScene("game");

  countdown = setInterval(() => {
    timer--;
    document.getElementById("progress-bar").style.width = `${timer * 10}%`;
    if (timer <= 0) endGame();
  }, 1000);
}

// 👆 Tap to slurp
document.getElementById("tap-area").addEventListener("click", () => {
  score++;

  const sprite = document.getElementById("sprite");
  if (sprite) {
    let spriteNum = 1;
    if (score <= 20) spriteNum = 1;
    else if (score <= 45) spriteNum = 2;
    else if (score <= 60) spriteNum = 3;
    else if (score <= 77) spriteNum = 4;
    else if (score <= 99) spriteNum = 5;
    else spriteNum = 6;

    sprite.src = `assets/${spriteNum}.png`;

    // 👇 Bounce on update
    sprite.classList.remove("bounce");
    void sprite.offsetWidth;
    sprite.classList.add("bounce");
  }

  document.getElementById("score").textContent = `Score: ${score}`;
});

// 🛑 Game over → Score submission → Show survey
async function endGame() {
  if (gameEnded) return;
  gameEnded = true;

  clearInterval(countdown);
  document.getElementById("tap-area").style.pointerEvents = "none"; // block input

  document.getElementById("final-score").textContent = `Your score is ${score}!`;

  const { error: scoreError } = await supabase.from('scores').insert([{
    name: player.name,
    email: player.email,
    phone: player.phone,
    score
  }]);

  if (scoreError) {
    console.error("❌ Failed to submit score:", scoreError.message);
    alert("Something went wrong saving your score. Try again.");
    return;
  }

  const { data: scores } = await supabase.from('safe_leaderboard').select('*');
  renderLeaderboard(scores);

  showScene("survey");
}

// 📋 Survey → Upload to Supabase → Show result
document.getElementById("survey-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = new FormData(e.target);

  const rating = parseInt(form.get("rating"), 10);
  const recommend = parseInt(form.get("recommend"), 10);
  const sources = form.getAll("source");
  const other_source = form.get("source-other") || null;

  const { error } = await supabase.from("survey_responses").insert([
    {
      phone: player.phone,
      rating,
      recommend,
      sources,
      other_source
    }
  ]);

  if (error) {
    console.error("❌ Failed to submit survey:", error.message);
    alert("Survey submission failed. Try again.");
  }

  showScene("result");
});

// 🏆 Leaderboard display
function renderLeaderboard(scores) {
  const list = document.getElementById("leaderboard");
  list.innerHTML = "";

  scores.forEach(entry => {
    const li = document.createElement("li");
    li.textContent = `${entry.name} – ${entry.score}`;
    if (entry.name.trim().toLowerCase() === player.name.trim().toLowerCase()) {
      li.classList.add("font-bold", "text-yellow-600");
    }
    list.appendChild(li);
  });
}

// 🔁 Play again → go to feedback screen
document.getElementById("play-again-btn").addEventListener("click", () => {
  showScene("feedback");
});

// 📝 Game experience feedback submission
document.getElementById("feedback-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = new FormData(e.target);

  const experience = parseInt(form.get("game-experience"), 10);
  const suggestion = form.get("game-feedback");

  const { error } = await supabase.from("game_feedback").insert([
    {
      phone: player.phone,
      experience,
      suggestion
    }
  ]);

  if (error) {
    console.error("❌ Failed to submit feedback:", error.message);
    alert("Feedback submission failed. Try again.");
    return;
  }

  // Reset state and go to start
  gameEnded = false;
  clearInterval(countdownTimer);
  document.getElementById("tutorial-countdown").classList.add("hidden");
  document.getElementById("tutorial-countdown").textContent = "Game starting in 3...";
  document.getElementById("ready-btn").classList.remove("hidden");
  showScene("start");
});