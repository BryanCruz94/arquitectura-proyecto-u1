const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const { PDFParse } = require("pdf-parse");

const app = express();
const PORT = 4005;

app.use(cors());
app.use(express.json());

function getMatchSnippets(content, tokens, beforeWords = 10, afterWords = 20) {
  const normalizedContent = content.replace(/\s+/g, " ");
  const words = normalizedContent.split(" ");

  const snippets = [];

  tokens.forEach(token => {
    const cleanToken = token.toLowerCase().trim();

    if (!cleanToken) return;

    const matchIndex = words.findIndex(word =>
      word.toLowerCase().includes(cleanToken)
    );

    if (matchIndex !== -1) {
      const start = Math.max(0, matchIndex - beforeWords);
      const end = Math.min(words.length, matchIndex + afterWords + 1);

      snippets.push({
        token,
        text: words.slice(start, end).join(" "),
        matchWord: words[matchIndex],
        startWord: start,
        endWord: end
      });
    }
  });

  return snippets;
}

app.post("/search-pdf", async (req, res) => {
  const { tokens, mode = "OR" } = req.body;

  console.log("[Search PDF Filter] Tokens recibidos:", tokens);
  console.log("[Search PDF Filter] Modo de búsqueda:", mode);
  console.log("[Search PDF Filter] Buscando coincidencias en archivos PDF...");

  if (!tokens || !Array.isArray(tokens) || tokens.length === 0) {
    return res.status(400).json({
      error: "El campo tokens es requerido y debe ser un arreglo con al menos un elemento"
    });
  }

  const searchMode = mode.toUpperCase();

  if (searchMode !== "OR" && searchMode !== "AND") {
    return res.status(400).json({
      error: "El modo de búsqueda debe ser OR o AND"
    });
  }

  try {
    const dataPath = path.join(__dirname, "../../data");
    const files = fs
      .readdirSync(dataPath)
      .filter(file => file.endsWith(".pdf"));

    const results = [];

    for (const file of files) {
      const filePath = path.join(dataPath, file);
      const buffer = fs.readFileSync(filePath);

      const parser = new PDFParse({ data: buffer });
      const pdfData = await parser.getText();

      const content = pdfData.text || "";
      const lowerContent = content.toLowerCase();

      let matches = 0;
      const matchedTokens = [];

      tokens.forEach(token => {
        const cleanToken = token.toLowerCase().trim();

        if (cleanToken && lowerContent.includes(cleanToken)) {
          matches++;
          matchedTokens.push(token);
        }
      });

      const isMatch =
        searchMode === "AND"
          ? matches === tokens.length
          : matches > 0;

      if (isMatch) {
        const snippets = getMatchSnippets(content, matchedTokens);

        results.push({
          type: "PDF",
          file,
          mode: searchMode,
          matches,
          totalTokens: tokens.length,
          matchedTokens,
          preview: snippets[0]?.text || "",
          snippets
        });
      }
    }

    console.log("[Search PDF Filter] Resultados encontrados:", results);

    res.json({ results });

  } catch (error) {
    console.error("[Search PDF Filter] Error:", error.message);

    res.status(500).json({
      error: "Error al procesar archivos PDF"
    });
  }
});

app.listen(PORT, () => {
  console.log(`[Search PDF Filter] Ejecutándose en http://localhost:${PORT}`);
});