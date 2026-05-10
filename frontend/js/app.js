const API_URL = "http://localhost:4000/search";

//Para el servicio de upload
const UPLOAD_URL = "http://localhost:4006";

const fileInput = document.getElementById("fileInput");
const uploadButton = document.getElementById("uploadButton");
const clearFilesButton = document.getElementById("clearFilesButton");
const uploadedFilesSection = document.getElementById("uploadedFilesSection");
const uploadedFilesList = document.getElementById("uploadedFilesList");
//fin de upload

const searchForm = document.getElementById("searchForm");
const searchInput = document.getElementById("searchInput");
const historyButton = document.getElementById("historyButton");

const loading = document.getElementById("loading");
const tokensSection = document.getElementById("tokensSection");
const resultsSection = document.getElementById("resultsSection");
const emptyState = document.getElementById("emptyState");

const tokensContainer = document.getElementById("tokensContainer");
const resultsContainer = document.getElementById("resultsContainer");

let searchMode = "OR";

historyButton.addEventListener("click", () => {
  window.location.href = "./history.html";
});

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


// Funciones para el servicio de upload
async function loadUploadedFiles() {
  try {
    const response = await fetch(`${UPLOAD_URL}/uploaded-files`);
    const data = await response.json();

    renderUploadedFiles(data.files || []);
  } catch (error) {
    console.error("Error al cargar archivos:", error);
  }
}

function renderUploadedFiles(files) {
  uploadedFilesList.innerHTML = "";

  if (files.length === 0) {
    uploadedFilesSection.classList.add("d-none");
    return;
  }

  files.forEach(file => {
    const li = document.createElement("li");
    li.textContent = `${file.name} - ${formatFileSize(file.size)}`;
    uploadedFilesList.appendChild(li);
  });

  uploadedFilesSection.classList.remove("d-none");
}

function formatFileSize(size) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;
  return `${(size / 1024 / 1024).toFixed(2)} MB`;
}


uploadButton.addEventListener("click", async () => {
  const files = fileInput.files;

  if (!files || files.length === 0) {
    alert("Selecciona al menos un archivo TXT o PDF.");
    return;
  }

  const formData = new FormData();

  Array.from(files).forEach(file => {
    formData.append("files", file);
  });

  try {
    uploadButton.disabled = true;
    uploadButton.textContent = "Subiendo...";

    const response = await fetch(`${UPLOAD_URL}/upload-files`, {
      method: "POST",
      body: formData
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Error al subir archivos");
    }

    fileInput.value = "";
    renderUploadedFiles(data.files || []);

  } catch (error) {
    console.error("Error:", error);
    alert(error.message || "No se pudieron subir los archivos.");
  } finally {
    uploadButton.disabled = false;
    uploadButton.textContent = "Subir archivos";
  }
});

clearFilesButton.addEventListener("click", async () => {
  const confirmDelete = confirm(
    "¿Seguro que deseas eliminar los archivos cargados?"
  );

  if (!confirmDelete) return;

  try {
    const response = await fetch(`${UPLOAD_URL}/uploaded-files`, {
      method: "DELETE"
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Error al eliminar archivos");
    }

    renderUploadedFiles([]);

  } catch (error) {
    console.error("Error:", error);
    alert("No se pudieron eliminar los archivos.");
  }
});

loadUploadedFiles();
// Fin de funciones para el servicio de upload
