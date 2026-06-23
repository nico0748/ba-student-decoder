export function fireConfetti() {
  const colors = ["#3aa6dd", "#acedfb", "#ff8f6b", "#b9e4f7", "#2386c0", "#ffffff"];
  for (let i = 0; i < 70; i++) {
    const c = document.createElement("div");
    c.className = "confetti";
    c.style.left = Math.random() * 100 + "vw";
    c.style.background = colors[i % colors.length];
    c.style.animationDuration = 1.6 + Math.random() * 1.4 + "s";
    c.style.animationDelay = Math.random() * 0.3 + "s";
    document.body.appendChild(c);
    setTimeout(() => c.remove(), 3400);
  }
}
