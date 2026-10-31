import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pool from "./db/pool.js";
import routerAssets from "./routes/assets.js";
import routerIspezioni from "./routes/ispezioni.js";
import routerLogin from "./routes/login.js";
import controlloToken from "./middleware/controlloToken.js";
import multer from "multer";

const PORT = 3000;
dotenv.config();
const app = express();

app.use(express.json());

app.use(cors());

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
