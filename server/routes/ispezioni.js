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
      `SELECT ispezioni.id, ispezioni.data,ispezioni.esito,assets.nome AS nome_asset,assets.tipologia,assets.indirizzo,zone.nome AS nome_zona,utenti.nome AS nome_utente,ispezioni.validazione,ispezioni.utente_id
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

routerIspezioni.get("/stato-asset", async (req, res) => {
  const zona = Number(req.query.zona);
  try {
    if (!zona || !Number.isInteger(zona)) {
      return res.status(400).json({ messaggio: "Zona mancante o non valida" });
    }
    const risposta = await pool.query(
      `SELECT DISTINCT ON(assets.id) assets.id AS id_asset, assets.nome, ispezioni.id AS id_ispezione, ispezioni.data,ispezioni.esito
FROM assets
LEFT JOIN ispezioni ON assets.id=ispezioni.asset_id
WHERE assets.zona_id=$1
ORDER BY assets.id, ispezioni.data DESC;`,
      [zona],
    );
    return res.status(200).json({ statoAsset: risposta.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ messaggio: "C'è stato un errore imprevisto" });
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

routerIspezioni.patch("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const statoValidazione = req.body.validazione;
  try {
    if (!id || !Number.isInteger(id)) {
      return res
        .status(400)
        .json({ messaggio: "Parametro mancante o non valido" });
    }

    if (
      !statoValidazione ||
      (statoValidazione !== "accettata" && statoValidazione !== "rifiutata")
    ) {
      return res.status(400).json({ messaggio: "Decisione inesistente" });
    }

    const risultato = await pool.query(
      `UPDATE ispezioni SET validazione=$1 WHERE id=$2 AND validazione= 'in_sospeso' RETURNING validazione`,
      [statoValidazione, id],
    );

    if (risultato.rows.length === 0) {
      return res
        .status(404)
        .json({ messaggio: "Ispezione non trovata o già validata" });
    }

    return res.status(200).json({ validazione: risultato.rows[0].validazione });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ messaggio: "Qualcosa è andato storto" });
  }
});

export default routerIspezioni;
