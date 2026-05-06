const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 4001;

app.use(cors());
app.use(express.json());

app.post("/clean", (req, res) => {
  const { text } = req.body;

  console.log("[Cleaning Filter] Input recibido:", text);

  if (!text) {
    return res.status(400).json({ error: "El campo text es requerido" });
  }

  const cleanedText = text.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s]/g, "");

  console.log("[Cleaning Filter] Output generado:", cleanedText);

  res.json({ text: cleanedText });
});

app.listen(PORT, () => {
  console.log(`[Cleaning Filter] Ejecutándose en http://localhost:${PORT}`);
});