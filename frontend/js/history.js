const HISTORY_URL = "http://localhost:4007/history";

const backButton = document.getElementById("backButton");
const historyLoading = document.getElementById("historyLoading");
const historySection = document.getElementById("historySection");
const historyContainer = document.getElementById("historyContainer");
const historyEmptyState = document.getElementById("historyEmptyState");

backButton.addEventListener("click", () => {
  if (window.opener && !window.opener.closed) {
    window.opener.focus();
    window.close();
    return;
  }

  window.location.href = "./index.html";
});

function normalizeTokens(tokens) {
  if (Array.isArray(tokens)) {
    return tokens;
  }

  if (typeof tokens === "string") {
    try {
      const parsedTokens = JSON.parse(tokens);
      return Array.isArray(parsedTokens) ? parsedTokens : [];
    } catch (error) {
      return [];
    }
  }

  return [];
}

function formatDate(value) {
  if (!value) return "Sin fecha";

  return new Intl.DateTimeFormat("es-EC", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderHistory(searches) {
  historyContainer.innerHTML = "";

  if (searches.length === 0) {
    historyEmptyState.classList.remove("d-none");
    return;
  }

  searches.forEach(search => {
    const tokens = normalizeTokens(search.tokens);
    const article = document.createElement("article");
    article.className = "search-result history-result";

    const tokensHtml = tokens.length > 0
      ? tokens.map(token => `<span class="token">${escapeHtml(token)}</span>`).join("")
      : `<span class="result-meta">Sin tokens registrados</span>`;

    article.innerHTML = `
      <h4>
        <span class="file-type">#${search.id}</span>
        ${escapeHtml(search.texto_original)}
      </h4>

      <div class="result-meta">
        Fecha: ${formatDate(search.creado_en)}
      </div>

      <div class="tokens-container history-tokens">
        ${tokensHtml}
      </div>
    `;

    historyContainer.appendChild(article);
  });

  historySection.classList.remove("d-none");
}

async function loadHistory() {
  try {
    const response = await fetch(HISTORY_URL);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Error al cargar historial");
    }

    renderHistory(data.searches || []);
  } catch (error) {
    console.error("Error:", error);
    alert("No se pudo cargar el historial. Verifica que MySQL y el filtro de persistencia esten encendidos.");
  } finally {
    historyLoading.classList.add("d-none");
  }
}

loadHistory();
