const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 4006;

app.use(cors());
app.use(express.json());

const dataPath = path.join(__dirname, "../data");

if (!fs.existsSync(dataPath)) {
  fs.mkdirSync(dataPath, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, dataPath);
  },
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/[^\w.\-áéíóúÁÉÍÓÚñÑ ]/g, "_");
    cb(null, Date.now() + "_" + safeName);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [".txt", ".pdf"];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Solo se permiten archivos TXT y PDF"));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024
  }
});

app.post("/upload-files", upload.array("files", 20), (req, res) => {
  console.log("[Upload Service] Archivos recibidos:", req.files);

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({
      error: "No se recibieron archivos"
    });
  }

  const uploadedFiles = req.files.map(file => ({
    originalName: file.originalname,
    savedName: file.filename,
    type: path.extname(file.originalname).toLowerCase(),
    size: file.size
  }));

  res.json({
    message: "Archivos subidos correctamente",
    files: uploadedFiles
  });
});

app.listen(PORT, () => {
  console.log(`[Upload Service] Ejecutándose en http://localhost:${PORT}`);
});