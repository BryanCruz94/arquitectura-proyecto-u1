const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 4003;

app.use(cors());
app.use(express.json());

const STOPWORDS = new Set([
  // artículos
  "el", "la", "los", "las", "un", "una", "unos", "unas",

  // preposiciones
  "a", "ante", "bajo", "con", "contra", "de", "desde", "durante",
  "en", "entre", "hacia", "hasta", "mediante", "para", "por",
  "segun", "sin", "sobre", "tras",

  // contracciones
  "al", "del",

  // conjunciones
  "y", "e", "o", "u", "ni", "pero", "aunque", "porque", "pues",
  "si", "sino", "mientras",

  // pronombres
  "yo", "tu", "usted", "el", "ella", "nosotros", "nosotras",
  "vosotros", "vosotras", "ustedes", "ellos", "ellas",
  "me", "te", "se", "nos", "os", "lo", "la", "le", "les",
  "mi", "mis", "tu", "tus", "su", "sus", "nuestro", "nuestra",
  "nuestros", "nuestras",

  // interrogativos y relativos
  "que", "quien", "quienes", "cual", "cuales", "cuando",
  "cuanto", "cuanta", "cuantos", "cuantas", "donde", "adonde",
  "como",

  // verbos comunes
  "ser", "estar", "es", "son", "soy", "eres", "somos", "estan",
  "esta", "estoy", "fue", "fueron", "era", "eran", "hay",
  "haber", "ha", "han", "he", "hemos", "hace", "hacer",

  // adverbios comunes
  "no", "si", "ya", "muy", "mas", "menos", "tambien", "solo",
  "aqui", "alli", "ahi", "bien", "mal",

  // términos frecuentes sin mucho valor para búsqueda
  "cosa", "cosas", "tema", "temas", "informacion", "datos"
]);

function removeAccents(text) {
  return text;
}

app.post("/tokenize", (req, res) => {
  const { text } = req.body;

  console.log("[Tokenization Filter] Input recibido:", text);

  if (!text) {
    return res.status(400).json({ error: "El campo text es requerido" });
  }

  const normalizedText = removeAccents(text.toLowerCase());

  const tokens = text
    .split(" ")
    .map(token => token.trim())
    .filter(token => token.length > 2)
    .filter(token => !STOPWORDS.has(token));

  console.log("[Tokenization Filter] Tokens generados sin stopwords:", tokens);

  res.json({ tokens });
});

app.listen(PORT, () => {
  console.log(`[Tokenization Filter] Ejecutándose en http://localhost:${PORT}`);
});