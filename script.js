async function detectFakeNews() {
  const input = document.getElementById("newsInput").value.trim();
  if(!input) return;

  const messages = document.getElementById("messages");

  /* USER MESSAGE */
  const user = document.createElement("div");
  user.className = "userMsg";
  user.innerHTML = input;
  messages.appendChild(user);
  document.getElementById("newsInput").value = "";

  /* TYPING ANIMATION */
  const typing = document.createElement("div");
  typing.className = "aiMsg typing";
  typing.innerHTML = "Analyzing credibility...";
  messages.appendChild(typing);
  messages.scrollTop = messages.scrollHeight;

  try {
    /* ⭐ CALL BACKEND CORRECTLY */
    const res = await fetch("/api/check-news", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: input })
    });

    const data = await res.json();
    // console.log("Server response:", data);
    typing.remove();

    /* DISPLAY AI VERDICT */
    const ai = document.createElement("div");
    ai.className = "aiMsg " + data.type; //
    
    // We now loop through the 'reasons' array sent by the server
    const reasonList = data.reasons.map(r => `• ${r}`).join("<br>");
    
    ai.innerHTML = `
      <b>${data.verdict}</b><br>
      <small>Credibility Score: ${data.score}%</small><br>
      <div style="font-size: 0.8em; margin-top: 5px; opacity: 0.8;">${reasonList}</div>
    `;
    messages.appendChild(ai);

    /* SCORE BAR */
    const bar = document.createElement("div");
    bar.className = "scoreBar";
    bar.innerHTML = `<div style="width:${data.score}%"></div>`;
    messages.appendChild(bar);

    /* HISTORY */
    const h = document.createElement("div");
    h.className = "historyItem";
    h.innerText = input.substring(0, 30) + "...";
    document.getElementById("historyList").prepend(h);

  } catch (error) {
    typing.innerHTML = "⚠ Error: Is the server running?";
    console.error(error);
  }
  
  messages.scrollTop = messages.scrollHeight;
}