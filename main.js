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
};

function showScene(scene) {
  Object.values(scenes).forEach(s => s.classList.add("hidden"));
  scenes[scene].classList.remove("hidden");
}

// 🎮 Start screen → Register
document.getElementById("start-btn").addEventListener("click", () => {
  showScene("register");
});

// 📝 Form submission → Start game
document.getElementById("register-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = new FormData(e.target);
  player.name = form.get("name");
  player.phone = form.get("phone"); // ← Add this line
  player.email = form.get("email");
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
});

// 👆 Tap to slurp
document.getElementById("tap-btn").addEventListener("click", () => {
  score++;
  document.getElementById("score").textContent = `Score: ${score}`;
});

// 🛑 Game over → Submit & load leaderboard
async function endGame() {
  clearInterval(countdown);
  document.getElementById("final-score").textContent = `Your score is ${score}!`;
  showScene("result");

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

const { error } = await supabase.from('scores').insert([
  { name: player.name, email: player.email, phone: player.phone, score }
]);

if (error) {
  console.error("❌ Supabase insert failed:", error.message);
} else {
  console.log("✅ Score submitted successfully!");
}