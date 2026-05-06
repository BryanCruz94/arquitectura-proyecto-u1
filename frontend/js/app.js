const API_URL = "http://localhost:4000/search";

const searchForm = document.getElementById("searchForm");
const searchInput = document.getElementById("searchInput");

const loading = document.getElementById("loading");
const tokensSection = document.getElementById("tokensSection");
const resultsSection = document.getElementById("resultsSection");
const emptyState = document.getElementById("emptyState");

const tokensContainer = document.getElementById("tokensContainer");
const resultsContainer = document.getElementById("resultsContainer");

let searchMode = "OR";

searchForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const submitButton = event.submitter;

  if (submitButton && submitButton.dataset.mode) {
    searchMode = submitButton.dataset.mode;
  }

  const text = searchInput.value.trim();

  if (!text) {
    alert("Ingresa una consulta para buscar.");
    return;
  }

  resetUI();
  loading.classList.remove("d-none");

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        text,
        mode: searchMode
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Error al buscar");
    }

    renderTokens(data.tokens || []);
    renderResults(data.results || [], searchMode);

  } catch (error) {
    console.error("Error:", error);
    alert("No se pudo conectar con el Gateway. Verifica que los servidores estén encendidos.");
  } finally {
    loading.classList.add("d-none");
  }
});

function resetUI() {
  tokensContainer.innerHTML = "";
  resultsContainer.innerHTML = "";

  tokensSection.classList.add("d-none");
  resultsSection.classList.add("d-none");
  emptyState.classList.add("d-none");
}

function renderTokens(tokens) {
  if (tokens.length === 0) return;

  tokens.forEach(token => {
    const span = document.createElement("span");
    span.className = "token";
    span.textContent = token;
    tokensContainer.appendChild(span);
  });

  tokensSection.classList.remove("d-none");
}

function renderResults(results, mode) {
  if (results.length === 0) {
    emptyState.classList.remove("d-none");
    return;
  }

  const modeLabel = mode === "AND"
    ? "Búsqueda precisa"
    : "Búsqueda ampliada";

  results.forEach(result => {
    const article = document.createElement("article");
    article.className = "search-result";

    article.innerHTML = `
      <h4>
        <span class="file-type">${result.type}</span>
        ${result.file}
      </h4>

      <div class="result-meta">
        Modo: ${modeLabel} |
        Coincidencias encontradas: ${result.matches} de ${result.totalTokens || ""}
      </div>

      <p class="preview">
        ${result.preview || ""}
      </p>
    `;

    resultsContainer.appendChild(article);
  });

  resultsSection.classList.remove("d-none");
}