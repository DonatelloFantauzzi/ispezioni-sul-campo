import express from "express";
import pool from "../db/pool.js";

const routerIspezioni = express.Router();

const esitiIspezione = ["conforme", "conforme_con_riserva", "non_conforme"];
const severitaDifetto = ["lieve", "media", "grave"];

routerIspezioni.get("/", async (req, res) => {
  const zona = Number(req.utente.zona);
  try {
    if (!zona || !Number.isInteger(zona)) {
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
  const zona = Number(req.utente.zona);
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

routerIspezioni.post("/", async (req, res) => {
  const { asset_id, esito, note, difetti, data } = req.body;
  const utente_id = req.utente.id;

  if (asset_id <= 0 || !Number.isInteger(asset_id)) {
    return res
      .status(400)
      .json({ messaggio: "id dell'asset mancante o non valido" });
  }

  if (!esitiIspezione.includes(esito)) {
    return res.status(400).json({ messaggio: "esito non valido" });
  }

  if (!Array.isArray(difetti)) {
    return res.status(400).json({ messaggio: "difetti non è un array" });
  }

  if (esito === "conforme" && difetti.length > 0) {
    return res
      .status(400)
      .json({ messaggio: "non possono esserci difetti se l'esito è conforme" });
  }

  if (esito !== "conforme" && difetti.length === 0) {
    return res
      .status(400)
      .json({ messaggio: "bisogna inserire almeno un difetto" });
  }

  const descrizioneDifetto = difetti.every(
    (difetto) =>
      typeof difetto.descrizione === "string" && difetto.descrizione.trim(),
  );
  const severita = difetti.every((difetto) =>
    severitaDifetto.includes(difetto.severita),
  );

  if (!descrizioneDifetto || !severita) {
    return res.status(400).json({
      messaggio: "La descrizione è vuota o la severità non è stata inserita",
    });
  }

  if (data) {
    const dataTrasformata = new Date(data);
    if (Number.isNaN(dataTrasformata.getTime())) {
      return res.status(400).json({ messaggio: "data non valida" });
    }
    if (dataTrasformata.getTime() > Date.now()) {
      return res
        .status(400)
        .json({ messaggio: "la data inserita non può essere futura" });
    }
  }

  let noteDaSalvare = null;

  if (note) {
    if (typeof note !== "string") {
      return res
        .status(400)
        .json({ messaggio: "le note devono essere delle stringhe" });
    }

    if (note.trim() !== "") {
      noteDaSalvare = note.trim();
    }
  }

  const assetEsistente = await pool.query("SELECT id FROM assets WHERE id=$1", [
    asset_id,
  ]);

  if (assetEsistente.rows.length === 0) {
    return res.status(404).json({ messaggio: "asset non esistente" });
  }

  const connessione = await pool.connect();

  try {
    await connessione.query("BEGIN");

    const risultato = await connessione.query(
      "INSERT INTO ispezioni(asset_id,utente_id,esito,note,data) VALUES($1,$2,$3,$4,COALESCE($5,NOW())) RETURNING id",
      [asset_id, utente_id, esito, noteDaSalvare, data ?? null],
    );

    const ispezioneId = risultato.rows[0].id;

    for (const difetto of difetti) {
      await connessione.query(
        "INSERT INTO difetti(ispezione_id,descrizione,severita) VALUES($1,$2,$3)",
        [ispezioneId, difetto.descrizione, difetto.severita],
      );
    }

    await connessione.query("COMMIT");
    res.status(201).json({ id: ispezioneId });
  } catch (error) {
    console.error(error);
    await connessione.query("ROLLBACK");
    res.status(500).json({ messaggio: "errore nel salvataggio" });
  } finally {
    connessione.release();
  }
});

export default routerIspezioni;
