require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");

const app = express();
const PORT = Number(process.env.PERSISTENCE_FILTER_PORT || 4007);
const DATABASE = process.env.MYSQL_DATABASE || "pipeline_search";

app.use(cors());
app.use(express.json());

function assertSafeDatabaseName(database) {
  if (!/^[a-zA-Z0-9_]+$/.test(database)) {
    throw new Error("MYSQL_DATABASE solo puede contener letras, numeros y guion bajo");
  }
}

const dbConfig = {
  host: process.env.MYSQL_HOST || "127.0.0.1",
  port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER || "root",
  password: process.env.MYSQL_PASSWORD || "admin1234",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

let pool;
let initializationPromise;

async function initializeDatabase() {
  assertSafeDatabaseName(DATABASE);

  const connection = await mysql.createConnection(dbConfig);
  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DATABASE}\``);
  await connection.end();

  pool = mysql.createPool({
    ...dbConfig,
    database: DATABASE
  });

  await pool.query(`
    CREATE TABLE IF NOT EXISTS busquedas (
      id INT AUTO_INCREMENT PRIMARY KEY,
      texto_original TEXT NOT NULL,
      tokens JSON NOT NULL,
      creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

function ensureDatabase() {
  if (!initializationPromise) {
    initializationPromise = initializeDatabase();
  }

  return initializationPromise;
}

app.post("/persist", async (req, res) => {
  try {
    const { originalText, tokens } = req.body;

    console.log("[Persistence Filter] Texto original recibido:", originalText);
    console.log("[Persistence Filter] Tokens recibidos:", tokens);

    if (!originalText) {
      return res.status(400).json({ error: "El campo originalText es requerido" });
    }

    if (!Array.isArray(tokens)) {
      return res.status(400).json({ error: "El campo tokens debe ser un arreglo" });
    }

    await ensureDatabase();

    const [result] = await pool.execute(
      "INSERT INTO busquedas (texto_original, tokens) VALUES (?, ?)",
      [originalText, JSON.stringify(tokens)]
    );

    console.log("[Persistence Filter] Busqueda guardada con id:", result.insertId);

    res.json({
      saved: true,
      id: result.insertId
    });
  } catch (error) {
    console.error("[Persistence Filter] Error:", error.message);

    res.status(500).json({
      error: "Error al guardar la busqueda en MySQL"
    });
  }
});

app.listen(PORT, () => {
  console.log(`[Persistence Filter] Ejecutandose en http://localhost:${PORT}`);
});
