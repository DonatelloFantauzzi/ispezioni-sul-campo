import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pool from "./db/pool.js";
import routerAssets from "./routes/assets.js";
import routerIspezioni from "./routes/ispezioni.js";
import routerLogin from "./routes/login.js";

const PORT = 3000;
dotenv.config();
const app = express();

app.use(express.json());

app.use(cors());

app.use("/api/login", routerLogin);
app.use("/api/assets", routerAssets);
app.use("/api/ispezioni", routerIspezioni);

app.get("/api/health", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    return res.status(200).json({ dbTime: result.rows[0] });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ messaggio: "Errore inaspettato" });
  }
});

app.listen(PORT, () => {
  console.log(`in ascolto dalla porta n° ${PORT}`);
});
