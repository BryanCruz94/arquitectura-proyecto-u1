const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

app.post("/search", async (req, res) => {
  try {
    const { text, mode = "OR" } = req.body;

    const searchMode = mode.toUpperCase();

    if (searchMode !== "OR" && searchMode !== "AND") {
      return res.status(400).json({
        error: "El modo de busqueda debe ser OR o AND"
      });
    }

    console.log("\n[Gateway] Nueva solicitud:", text);
    console.log("[Gateway] Modo de busqueda:", searchMode);

    // 1. Cleaning
    const cleaningRes = await fetch("http://localhost:4001/clean", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    });

    const cleaningData = await cleaningRes.json();

    // 2. Normalization
    const normalizationRes = await fetch("http://localhost:4002/normalize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: cleaningData.text })
    });

    const normalizationData = await normalizationRes.json();

    // 3. Tokenization
    const tokenizationRes = await fetch("http://localhost:4003/tokenize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: normalizationData.text })
    });

    const tokenizationData = await tokenizationRes.json();

    const tokens = tokenizationData.tokens;

    console.log("[Gateway] Tokens finales:", tokens);

    // 4. Persistence
    const persistenceRes = await fetch("http://localhost:4007/persist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        originalText: text,
        tokens
      })
    });

    const persistenceData = await persistenceRes.json();

    if (!persistenceRes.ok) {
      throw new Error(persistenceData.error || "Error en el filtro de persistencia");
    }

    console.log("[Gateway] Registro guardado en MySQL:", persistenceData.id);

    // 5. Bifurcacion TXT + PDF
    const [txtRes, pdfRes] = await Promise.all([
      fetch("http://localhost:4004/search-txt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tokens,
          mode: searchMode
        })
      }),
      fetch("http://localhost:4005/search-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tokens,
          mode: searchMode
        })
      })
    ]);

    const txtData = await txtRes.json();
    const pdfData = await pdfRes.json();

    const combinedResults = [
      ...(txtData.results || []),
      ...(pdfData.results || [])
    ];

    console.log("[Gateway] Resultados combinados:", combinedResults);

    res.json({
      tokens,
      persistenceId: persistenceData.id,
      mode: searchMode,
      results: combinedResults
    });

  } catch (error) {
    console.error("[Gateway] Error:", error.message);

    res.status(500).json({
      error: "Error en el procesamiento del pipeline"
    });
  }
});

app.listen(PORT, () => {
  console.log(`[Gateway] Ejecutandose en http://localhost:${PORT}`);
});
