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

function getCurrentFiles() {
  return fs.readdirSync(dataPath)
    .filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ext === ".txt" || ext === ".pdf";
    })
    .map(file => {
      const filePath = path.join(dataPath, file);
      const stats = fs.statSync(filePath);

      return {
        name: file,
        size: stats.size,
        type: path.extname(file).toLowerCase(),
        uploadedAt: stats.birthtime
      };
    });
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
  const ext = path.extname(file.originalname).toLowerCase();

  if (ext === ".txt" || ext === ".pdf") {
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
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({
      error: "No se recibieron archivos"
    });
  }

  res.json({
    message: "Archivos subidos correctamente",
    files: getCurrentFiles()
  });
});

app.get("/uploaded-files", (req, res) => {
  res.json({
    files: getCurrentFiles()
  });
});

app.delete("/uploaded-files", (req, res) => {
  try {
    console.log("[Upload Service] Ruta dataPath:", dataPath);

    const files = fs.readdirSync(dataPath)
      .filter(file => {
        const ext = path.extname(file).toLowerCase();
        return ext === ".txt" || ext === ".pdf";
      });

    console.log("[Upload Service] Archivos a eliminar:", files);

    files.forEach(file => {
      const filePath = path.join(dataPath, file);

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log("[Upload Service] Eliminado:", filePath);
      }
    });

    const remainingFiles = getCurrentFiles();

    console.log("[Upload Service] Archivos restantes:", remainingFiles);

    res.json({
      message: "Archivos temporales eliminados correctamente",
      deletedCount: files.length,
      files: remainingFiles
    });

  } catch (error) {
    console.error("[Upload Service] Error al eliminar archivos:", error.message);

    res.status(500).json({
      error: "No se pudieron eliminar los archivos temporales",
      detail: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`[Upload Service] Ejecutándose en http://localhost:${PORT}`);
});