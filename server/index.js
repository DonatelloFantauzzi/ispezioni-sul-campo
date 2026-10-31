import "dotenv/config"; // ← prima di tutto: carica il .env prima che gli altri import leggano process.env
import express from "express";
import cors from "cors";
import pool from "./db/pool.js";
import routerAssets from "./routes/assets.js";
import routerIspezioni from "./routes/ispezioni.js";
import routerLogin from "./routes/login.js";
import controlloToken from "./middleware/controlloToken.js";
import multer from "multer";

const PORT = process.env.PORT || 3000; // ← su Render la porta la decide il servizio, sul Mac resta 3000
const app = express();

app.use(express.json());

app.use(cors({ origin: process.env.CLIENT_URL })); // ← dice sì solo al client vero

app.use("/api/login", routerLogin);
app.use("/api/assets", controlloToken, routerAssets);
app.use("/api/ispezioni", controlloToken, routerIspezioni);

app.get("/api/health", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    return res.status(200).json({ dbTime: result.rows[0] });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ messaggio: "Errore inaspettato" });
  }
});

// Sportello degli errori: Express ci arriva solo quando un middleware prima ha segnalato un errore.
// Si riconosce dai QUATTRO parametri: il primo è l'errore.
app.use((err, req, res, next) => {
  // Nel terminale del server vediamo sempre cosa è successo.
  console.error(err);

  // Errori dei limiti di Multer (peso, numero di file): hanno un code.
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res
        .status(400)
        .json({ messaggio: "Una foto è troppo pesante: massimo 5 MB" });
    }
    return res.status(400).json({ messaggio: "Troppi file nell'ispezione" });
  }

  // L'errore del nostro fileFilter: il messaggio l'abbiamo scritto noi in upload.js.
  if (err.message === "Sono ammesse solo immagini") {
    return res.status(400).json({ messaggio: err.message });
  }

  // Qualsiasi altro errore imprevisto: 500, ma sempre in JSON.
  return res.status(500).json({ messaggio: "C'è stato un errore imprevisto" });
});

app.listen(PORT, () => {
  console.log(`in ascolto dalla porta n° ${PORT}`);
});
