const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 4002;

app.use(cors());
app.use(express.json());

//Filtro de normalización: Minúsculas + Limpia espacios extra
app.post("/normalize", (req, res) => {
  const { text } = req.body;

  console.log("[Normalization Filter] Input recibido:", text);

  if (!text) {
    return res.status(400).json({ error: "El campo text es requerido" });
  }

  // minúsculas + limpiar espacios extra
  const normalizedText = text
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

  console.log("[Normalization Filter] Output generado:", normalizedText);

  res.json({ text: normalizedText });
});

app.listen(PORT, () => {
  console.log(`[Normalization Filter] Ejecutándose en http://localhost:${PORT}`);
});