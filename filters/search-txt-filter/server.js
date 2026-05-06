const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 4004;

app.use(cors());
app.use(express.json());

function getMatchSnippets(content, tokens, beforeWords = 10, afterWords = 20) {
  const normalizedContent = content.replace(/\s+/g, " ");
  const words = normalizedContent.split(" ");

  const snippets = [];

  tokens.forEach(token => {
    const cleanToken = token.toLowerCase();

    const matchIndex = words.findIndex(word =>
      word.toLowerCase().includes(cleanToken)
    );

    if (matchIndex !== -1) {
      const start = Math.max(0, matchIndex - beforeWords);
      const end = Math.min(words.length, matchIndex + afterWords + 1);

      snippets.push({
        token,
        text: words.slice(start, end).join(" "),
        matchWord: words[matchIndex]
      });
    }
  });

  return snippets;
}

app.post("/search-txt", (req, res) => {
  const { tokens, mode = "OR" } = req.body;

  console.log("[Search TXT Filter] Tokens recibidos:", tokens);
  console.log("[Search TXT Filter] Modo de búsqueda:", mode);

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

  const dataPath = path.join(__dirname, "../../data");
  const files = fs.readdirSync(dataPath).filter(file => file.endsWith(".txt"));

  const results = [];

  files.forEach(file => {
    const filePath = path.join(dataPath, file);
    const content = fs.readFileSync(filePath, "utf8");
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
        type: "TXT",
        file,
        mode: searchMode,
        matches,
        totalTokens: tokens.length,
        matchedTokens,
        preview: snippets[0]?.text || "",
        snippets
      });
    }
  });

  console.log("[Search TXT Filter] Resultados encontrados:", results);

  res.json({ results });
});

app.listen(PORT, () => {
  console.log(`[Search TXT Filter] Ejecutándose en http://localhost:${PORT}`);
});