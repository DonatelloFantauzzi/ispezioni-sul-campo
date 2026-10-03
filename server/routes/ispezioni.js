import express from "express";
import pool from "../db/pool.js";

const routerIspezioni = express.Router();

routerIspezioni.get("/", async (req, res) => {
  const zona = req.query.zona;
  const zonaNumber = Number(zona);
  try {
    if (!zona || !Number.isInteger(zonaNumber)) {
      return res
        .status(400)
        .json({ messaggio: "Zona mancante o non corretta" });
    }
    const risposta = await pool.query(
      `SELECT ispezioni.id, ispezioni.data,ispezioni.esito,assets.nome AS nome_asset,assets.tipologia,assets.indirizzo,zone.nome AS nome_zona,utenti.nome AS nome_utente,ispezioni.validazione
FROM ispezioni
JOIN assets ON ispezioni.asset_id=assets.id
JOIN utenti ON ispezioni.utente_id=utenti.id
JOIN zone ON assets.zona_id=zone.id
WHERE assets.zona_id=$1
ORDER BY ispezioni.data DESC`,
      [zona],
    );
    return res.status(200).json({ ispezioni: risposta.rows });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ messaggio: "C'è stato un errore imprevisto" });
  }
});

routerIspezioni.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  try {
    if (!id || !Number.isInteger(id)) {
      return res
        .status(400)
        .json({ messaggio: "Parametro mancante o non valido" });
    }
    const ispezione = await pool.query(
      `SELECT ispezioni.id, ispezioni.note, ispezioni.data,ispezioni.esito,assets.nome AS nome_asset,assets.tipologia,assets.indirizzo,zone.nome AS nome_zona,utenti.nome AS nome_utente,ispezioni.validazione
FROM ispezioni
JOIN assets ON ispezioni.asset_id=assets.id
JOIN utenti ON ispezioni.utente_id=utenti.id
JOIN zone ON assets.zona_id=zone.id
WHERE ispezioni.id=$1`,
      [id],
    );
    if (ispezione.rows.length === 0) {
      return res.status(404).json({ messaggio: "Ispezione non trovata" });
    }

    const difetti = await pool.query(
      `SELECT id,descrizione,severita FROM difetti WHERE ispezione_id = $1`,
      [id],
    );

    const idDifetti = difetti.rows.map((difetto) => {
      return difetto.id;
    });

    const foto = await pool.query(
      `SELECT id,url,difetto_id FROM foto WHERE difetto_id= ANY($1)`,
      [idDifetti],
    );

    const difettiConFoto = difetti.rows.map((difetto) => {
      return {
        ...difetto,
        foto: foto.rows.filter((fotoSingola) => {
          return fotoSingola.difetto_id === difetto.id;
        }),
      };
    });

    const ispezioneCompleta = {
      ...ispezione.rows[0],
      difetti: [...difettiConFoto],
    };

    return res.status(200).json({
      ispezione: ispezioneCompleta,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ messaggio: "C'è satto un errore imprevisto" });
  }
});

export default routerIspezioni;
