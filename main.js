import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

// 🔐 Replace this with your actual anon key (safe if RLS is on)
const supabase = createClient(
  'https://nbevrkrmfotibeuhrtzq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5iZXZya3JtZm90aWJldWhydHpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcxNzY5ODcsImV4cCI6MjA2Mjc1Mjk4N30.tJck5rndFMVcwZFeRCy8zTAuXfcxDSxB6MszOZUpSwg'
);

// Game state
let score = 0;
let timer = 10;
let countdown;
let player = { name: "", email: "" };

// Scene switching
const scenes = {
  start: document.getElementById("scene-start"),
  register: document.getElementById("scene-register"),
  game: document.getElementById("scene-game"),
  result: document.getElementById("scene-result"),
  survey: document.getElementById("scene-survey"),
  tutorial: document.getElementById("scene-tutorial"),
};

function showScene(scene) {
  Object.values(scenes).forEach(s => s.classList.add("hidden"));
  scenes[scene].classList.remove("hidden");
}

// 🎮 Start screen → Register
document.getElementById("scene-start").addEventListener("click", () => {
  showScene("register");
});

// 📝 Form submission → Start game
document.getElementById("register-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = new FormData(e.target);
  player.name = form.get("name");
  player.phone = form.get("phone");
  player.email = form.get("email");

  showScene("tutorial");
  // Wait for "I'm Ready" button press to start countdown (handled below)
});

// 🟡 "I'm Ready!" button triggers countdown, then game starts
document.getElementById("ready-btn").addEventListener("click", () => {
  let countdownVal = 3;
  const tutorialText = document.getElementById("tutorial-countdown");
  tutorialText.textContent = `Game starting in ${countdownVal}...`;

  const interval = setInterval(() => {
    countdownVal--;
    tutorialText.textContent = `Game starting in ${countdownVal}...`;
    if (countdownVal <= 0) {
      clearInterval(interval);
      startGame();
    }
  }, 1000);
});

function startGame() {
  score = 0;
  timer = 10;
  document.getElementById("score").textContent = "Score: 0";
  document.getElementById("progress-bar").style.width = "100%";

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
  document.getElementById("score").textContent = `Score: ${score}`;
});

// 📋 Survey submission → Upload to Supabase, then show result
document.getElementById("survey-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = new FormData(e.target);

  const rating = parseInt(form.get("rating"), 10);
  const recommend = parseInt(form.get("recommend"), 10);
  const sources = form.getAll("source");
  const other_source = form.get("source-other") || null;

  // 📤 Submit survey data to Supabase
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
  } else {
    console.log("✅ Survey submitted!");
  }

  showScene("result");
});

// 🛑 Game over → Submit & load leaderboard
async function endGame() {
  clearInterval(countdown);
  document.getElementById("final-score").textContent = `Your score is ${score}!`;
  showScene("survey");

  // 📤 Submit score to Supabase
  await supabase.from('scores').insert([
    {
      name: player.name,
      email: player.email,
      phone: player.phone, // ← Add this too
      score
    }
  ]);

  // 📥 Fetch leaderboard (from VIEW, no PII)
  const { data: scores } = await supabase
    .from('safe_leaderboard')
    .select('*');

  renderLeaderboard(scores);
}

// 🏆 Show leaderboard & highlight player if ranked
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

// 🔁 Play again
document.getElementById("play-again-btn").addEventListener("click", () => {
  showScene("start");
});