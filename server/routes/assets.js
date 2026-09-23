import express from "express";
import pool from "../db/pool.js";

const routerAssets = express.Router();

routerAssets.get("/", async (req, res) => {
  try {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    const raggio = Number(req.query.raggio);
    const risposta = await pool.query(
      "SELECT id,nome,indirizzo,tipologia, ST_X(geom::geometry) AS lng, ST_Y(geom::geometry) AS lat FROM assets WHERE ST_DWithin(geom, ST_SetSRID(ST_MakePoint($1,$2), 4326)::geography,$3)",
      [lng, lat, raggio],
    );
    return res.status(200).json({ assets: risposta.rows });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ messaggio: "Errore insapettato del server" });
  }
});

export default routerAssets;
