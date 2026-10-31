// Importa Express, che ci serve per creare il router delle ispezioni.
import express from "express";
// Importa il pool: il gruppo di connessioni già aperte verso Postgres.
import pool from "../db/pool.js";
// Importa Multer già configurato (memoria, limiti, solo immagini), per aprire i pacchi multipart con le foto.
import upload from "../middleware/upload.js";
// Importa Cloudinary già configurato con le tre chiavi del .env, per caricare le foto e ottenere i loro indirizzi.
import cloudinary from "../config/cloudinary.js";

// Crea un "mini server" che raccoglie solo le rotte delle ispezioni.
// In index.js viene montato su /api/ispezioni, dietro controlloToken:
// quindi "/" qui vuol dire /api/ispezioni, e "/:id" vuol dire /api/ispezioni/:id.
const routerIspezioni = express.Router();

// I valori ammessi per l'esito e per la severità: la portineria della POST li usa con includes.
// Sono gli stessi del CHECK nello schema.sql.
const esitiIspezione = ["conforme", "conforme_con_riserva", "non_conforme"];
const severitaDifetto = ["lieve", "media", "grave"];

// ─────────────────────────────────────────────
// GET /api/ispezioni → il REGISTRO del supervisore
// ─────────────────────────────────────────────
routerIspezioni.get("/", async (req, res) => {
  try {
    // La zona non arriva dalla URL ma dal token: controlloToken l'ha appoggiata su req.utente.
    let zona = null;
    // Nel token è una stringa, quindi la trasformiamo in numero.
    const ruolo = req.utente.ruolo;
    // Se la zona manca (0, NaN) o non è un intero, la richiesta non ha senso: 400.
    if (ruolo !== "admin") {
      zona = Number(req.utente.zona);
      if (!zona || !Number.isInteger(zona)) {
        return res
          .status(400)
          .json({ messaggio: "Zona mancante o non corretta" });
      }
    }

    // Una query sola con i JOIN: per ogni ispezione prende anche
    // nome, tipologia e indirizzo dell'asset, il nome del municipio e il nome dell'operatore.
    // Gli AS servono perché "nome" esiste in più tabelle: senza alias pg terrebbe solo l'ultimo.
    // WHERE tiene solo le ispezioni degli asset della zona del supervisore,
    // ORDER BY ... DESC mette in alto la più recente.
    const risposta = await pool.query(
      `SELECT ispezioni.id, ispezioni.data,ispezioni.esito,assets.nome AS nome_asset,assets.tipologia,assets.indirizzo,zone.nome AS nome_zona,utenti.nome AS nome_utente,ispezioni.validazione,ispezioni.utente_id
FROM ispezioni
JOIN assets ON ispezioni.asset_id=assets.id
JOIN utenti ON ispezioni.utente_id=utenti.id
JOIN zone ON assets.zona_id=zone.id
WHERE ($1::bigint IS NULL OR assets.zona_id = $1)
ORDER BY ispezioni.data DESC`,
      [zona],
    );
    // rows è l'array delle righe trovate: lo mandiamo al client dentro la chiave "ispezioni".
    return res.status(200).json({ ispezioni: risposta.rows });
  } catch (error) {
    // Qualsiasi errore imprevisto (database spento, query sbagliata): lo stampiamo nel terminale del server
    // e al client rispondiamo 500 con un messaggio generico.
    console.error(error);
    return res
      .status(500)
      .json({ messaggio: "C'è stato un errore imprevisto" });
  }
});

// ─────────────────────────────────────────────
// GET /api/ispezioni/stato-asset → la scheda DA GESTIRE
// Sta SOPRA "/:id": il parametro è goloso, e se fosse sotto
// Express leggerebbe "stato-asset" come se fosse un id.
// ─────────────────────────────────────────────
routerIspezioni.get("/stato-asset", async (req, res) => {
  // Stessa zona presa dal token, stesso controllo del Registro.
  let zona = null;
  const ruolo = req.utente.ruolo;
  try {
    if (ruolo !== "admin") {
      zona = Number(req.utente.zona);
      if (!zona || !Number.isInteger(zona)) {
        return res
          .status(400)
          .json({ messaggio: "Zona mancante o non valida" });
      }
    }

    // Una riga per ogni asset della zona, con la sua ultima ispezione:
    // - parte da assets, non da ispezioni, perché vogliamo TUTTI gli asset;
    // - LEFT JOIN tiene anche gli asset senza ispezioni (i loro campi dell'ispezione saranno null → righe grigie);
    // - DISTINCT ON (assets.id) tiene una sola riga per asset: la prima secondo l'ORDER BY;
    // - ORDER BY assets.id, ispezioni.data DESC fa sì che quella prima riga sia l'ispezione più recente.
    // Gli alias id_asset e id_ispezione evitano che i due "id" si sovrascrivano.
    const risposta = await pool.query(
      `SELECT DISTINCT ON(assets.id) assets.id AS id_asset, assets.nome, ispezioni.id AS id_ispezione, ispezioni.data,ispezioni.esito
FROM assets
LEFT JOIN ispezioni ON assets.id=ispezioni.asset_id
WHERE ($1::bigint IS NULL OR assets.zona_id = $1)
ORDER BY assets.id, ispezioni.data DESC;`,
      [zona],
    );
    // Mandiamo le righe dentro la chiave "statoAsset". L'ordinamento per colore lo fa il client.
    return res.status(200).json({ statoAsset: risposta.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ messaggio: "C'è stato un errore imprevisto" });
  }
});

// ─────────────────────────────────────────────
// GET /api/ispezioni/:id → il DETTAGLIO di una singola ispezione
// ─────────────────────────────────────────────
routerIspezioni.get("/:id", async (req, res) => {
  // L'id arriva dalla URL (es. /api/ispezioni/87) come stringa: lo trasformiamo in numero.
  const id = Number(req.params.id);
  try {
    // Id mancante o non intero (es. /api/ispezioni/ciao): 400.
    if (!id || !Number.isInteger(id)) {
      return res
        .status(400)
        .json({ messaggio: "Parametro mancante o non valido" });
    }
    // PRIMA QUERY: l'ispezione, con i JOIN per avere asset, municipio e operatore.
    // Qui prendiamo anche le note, che nel Registro non servono.
    const ispezione = await pool.query(
      `SELECT ispezioni.id, ispezioni.note, ispezioni.data,ispezioni.esito,assets.nome AS nome_asset,assets.tipologia,assets.indirizzo,zone.nome AS nome_zona,utenti.nome AS nome_utente,ispezioni.validazione
FROM ispezioni
JOIN assets ON ispezioni.asset_id=assets.id
JOIN utenti ON ispezioni.utente_id=utenti.id
JOIN zone ON assets.zona_id=zone.id
WHERE ispezioni.id=$1`,
      [id],
    );
    // Nessuna riga = l'ispezione con quell'id non esiste: 404.
    if (ispezione.rows.length === 0) {
      return res.status(404).json({ messaggio: "Ispezione non trovata" });
    }

    // SECONDA QUERY: i difetti di questa ispezione.
    const difetti = await pool.query(
      `SELECT id,descrizione,severita FROM difetti WHERE ispezione_id = $1`,
      [id],
    );

    // Dall'array dei difetti teniamo solo i loro id, es. ["140", "141"]:
    // ci servono per chiedere le foto di tutti i difetti in un colpo solo.
    const idDifetti = difetti.rows.map((difetto) => {
      return difetto.id;
    });

    // TERZA QUERY: le foto di tutti quei difetti.
    // ANY($1) vuol dire "difetto_id è uno qualsiasi dei valori dell'array": è come un IN, ma con un array.
    const foto = await pool.query(
      `SELECT id,url,difetto_id FROM foto WHERE difetto_id= ANY($1)`,
      [idDifetti],
    );

    // Ricomponiamo: a ogni difetto attacchiamo un array "foto" con solo le foto che hanno il suo difetto_id.
    // Lo spread copia id, descrizione e severità; foto è la chiave nuova.
    const difettiConFoto = difetti.rows.map((difetto) => {
      return {
        ...difetto,
        foto: foto.rows.filter((fotoSingola) => {
          return fotoSingola.difetto_id === difetto.id;
        }),
      };
    });

    // L'oggetto finale: tutti i campi dell'ispezione (la sua unica riga, rows[0])
    // più la chiave "difetti", con dentro i difetti che hanno già le loro foto.
    const ispezioneCompleta = {
      ...ispezione.rows[0],
      difetti: [...difettiConFoto],
    };

    // Un solo oggetto al client, dentro la chiave "ispezione".
    return res.status(200).json({
      ispezione: ispezioneCompleta,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ messaggio: "C'è stato un errore imprevisto" });
  }
});

// ─────────────────────────────────────────────
// PATCH /api/ispezioni/:id → la VALIDAZIONE (Accetta / Rifiuta)
// ─────────────────────────────────────────────
routerIspezioni.patch("/:id", async (req, res) => {
  // L'id dalla URL, trasformato in numero.
  const id = Number(req.params.id);
  // La decisione dal body JSON (aperto da express.json): "accettata" o "rifiutata".
  const statoValidazione = req.body.validazione;
  try {
    // Id non valido: 400.
    if (!id || !Number.isInteger(id)) {
      return res
        .status(400)
        .json({ messaggio: "Parametro mancante o non valido" });
    }

    // Decisione mancante o diversa dalle due ammesse: 400.
    if (
      !statoValidazione ||
      (statoValidazione !== "accettata" && statoValidazione !== "rifiutata")
    ) {
      return res.status(400).json({ messaggio: "Decisione inesistente" });
    }

    // Aggiorna la validazione SOLO se l'ispezione esiste ed è ancora in sospeso.
    // Il controllo sta nel WHERE, così se due supervisori premono insieme vince solo il primo.
    // RETURNING validazione restituisce il nuovo valore appena scritto.
    const risultato = await pool.query(
      `UPDATE ispezioni SET validazione=$1 WHERE id=$2 AND validazione= 'in_sospeso' RETURNING validazione`,
      [statoValidazione, id],
    );

    // Nessuna riga aggiornata = ispezione inesistente oppure già validata: 404.
    if (risultato.rows.length === 0) {
      return res
        .status(404)
        .json({ messaggio: "Ispezione non trovata o già validata" });
    }

    // Rimandiamo al client il nuovo valore, che il dettaglio usa per cambiare l'etichetta.
    return res.status(200).json({ validazione: risultato.rows[0].validazione });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ messaggio: "Qualcosa è andato storto" });
  }
});

// ─────────────────────────────────────────────
// POST /api/ispezioni → una NUOVA ISPEZIONE dal form dell'operatore
// upload.any() è Multer: prima che parta la nostra funzione apre il pacco multipart
// e mette gli scomparti di testo in req.body (come stringhe) e i file in req.files.
// ─────────────────────────────────────────────
routerIspezioni.post("/", upload.any(), async (req, res) => {
  // La variabile sta fuori dal try perché la usiamo anche dopo.
  let ispezione;
  try {
    // Lo scomparto "ispezione" è un JSON trasformato in stringa dal client:
    // Multer non lo interpreta, quindi lo ritrasformiamo noi in oggetto.
    ispezione = JSON.parse(req.body.ispezione);
    // JSON.parse("null") non dà errore ma restituisce null, e la destrutturazione qui sotto crasherebbe:
    // !ispezione ferma null (e valori senza senso come false o 0) prima che succeda.
    if (!ispezione) {
      return res
        .status(400)
        .json({ messaggio: "l'ispezione non è del formato corretto" });
    }
  } catch (error) {
    // Scomparto mancante o JSON rotto: JSON.parse lancia un errore e rispondiamo 400.
    return res
      .status(400)
      .json({ messaggio: "dati dell'ispezione mancanti o non validi" });
  }
  // Dall'oggetto prendiamo i cinque campi della busta.
  const { asset_id, esito, note, difetti, data } = ispezione;
  // Provvisorio: stampa nel terminale del server le foto arrivate.
  console.log(req.files);
  // L'id dell'operatore lo prendiamo dal token, mai dalla busta:
  // così nessuno può firmare un'ispezione a nome di un collega.
  const utente_id = req.utente.id;

  // ── PORTINERIA: controlli sulla busta prima di toccare il database ──

  // L'id dell'asset deve essere un intero maggiore di zero.
  if (asset_id <= 0 || !Number.isInteger(asset_id)) {
    return res
      .status(400)
      .json({ messaggio: "id dell'asset mancante o non valido" });
  }

  // L'esito deve essere uno dei tre ammessi.
  if (!esitiIspezione.includes(esito)) {
    return res.status(400).json({ messaggio: "esito non valido" });
  }

  // I difetti devono essere un array (anche vuoto).
  if (!Array.isArray(difetti)) {
    return res.status(400).json({ messaggio: "difetti non è un array" });
  }

  // Un'ispezione conforme non può avere difetti.
  if (esito === "conforme" && difetti.length > 0) {
    return res
      .status(400)
      .json({ messaggio: "non possono esserci difetti se l'esito è conforme" });
  }

  // Un'ispezione non conforme o con riserva deve averne almeno uno.
  if (esito !== "conforme" && difetti.length === 0) {
    return res
      .status(400)
      .json({ messaggio: "bisogna inserire almeno un difetto" });
  }

  // every risponde true solo se TUTTI i difetti superano la prova.
  // Prima prova: la descrizione è una stringa e, tolti gli spazi, non è vuota.
  const descrizioneDifetto = difetti.every(
    (difetto) =>
      typeof difetto.descrizione === "string" && difetto.descrizione.trim(),
  );
  // Seconda prova: la severità è una delle tre ammesse.
  const severita = difetti.every((difetto) =>
    severitaDifetto.includes(difetto.severita),
  );

  // Se anche un solo difetto non supera una delle due prove: 400.
  if (!descrizioneDifetto || !severita) {
    return res.status(400).json({
      messaggio: "La descrizione è vuota o la severità non è stata inserita",
    });
  }

  // ── PORTINERIA DELLE FOTO ──
  // Le foto stanno in req.files (le ha messe Multer), i difetti nella busta.
  // L'unico filo che le lega è l'etichetta: "foto-1" vuol dire "sono del difetto in posizione 1".
  // Questi controlli verificano che quel filo sia fatto bene, prima di mandare qualsiasi cosa a Cloudinary.

  // Con l'esito conforme non ci sono difetti, quindi non c'è niente a cui attaccare una foto.
  if (esito === "conforme" && req.files.length > 0) {
    return res
      .status(400)
      .json({ messaggio: "Se l'esito è conforme non ci possono foto" });
  }

  if (req.files) {
    // Ogni foto deve puntare a un difetto che esiste.
    // every risponde true solo se TUTTE le foto superano la prova: la freccia restituisce
    // solo vero o falso, e il 400 si decide fuori, nell'if (un return dentro la freccia non fermerebbe la rotta).
    const descrizioneFoto = req.files.every((file) => {
      // "foto-1".split("-") → ["foto", "1"]
      const nomeCampo = file.fieldname.split("-");
      // L'etichetta è buona se: la prima parte è "foto", il numero è intero,
      // è almeno 0 ed è al massimo l'ultima posizione dei difetti (con 2 difetti: 0 o 1).
      return (
        nomeCampo[0] === "foto" &&
        Number.isInteger(Number(nomeCampo[1])) &&
        Number(Number(nomeCampo[1])) >= 0 &&
        Number(nomeCampo[1]) <= difetti.length - 1
      );
    });
    // Anche una sola etichetta sbagliata (es. "foto-5" con due difetti): 400.
    if (!descrizioneFoto) {
      return res.status(400).json({ messaggio: "foto non conforme" });
    }

    // Al massimo 3 foto per difetto.
    // some risponde true se ALMENO UN difetto supera la prova, cioè se almeno uno ha troppe foto.
    // index è la posizione del difetto: con quella ricostruiamo la sua etichetta.
    const troppeFoto = difetti.some((difetto, index) => {
      // Tiene solo i file con l'etichetta di questo difetto, es. "foto-0".
      const fotoDelDifetto = req.files.filter((file) => {
        return file.fieldname === `foto-${index}`;
      });
      // Vero se questo difetto ha più di 3 foto: some si ferma al primo vero.
      return fotoDelDifetto.length > 3;
    });

    // Anche un solo difetto con troppe foto: 400.
    if (troppeFoto) {
      return res.status(400).json({ messaggio: "massimo 3 foto per difetto" });
    }
  }

  // La data è facoltativa: la controlliamo solo se c'è.
  if (data) {
    const dataTrasformata = new Date(data);
    // Una stringa che non è una data dà un getTime() NaN: 400.
    if (Number.isNaN(dataTrasformata.getTime())) {
      return res.status(400).json({ messaggio: "data non valida" });
    }
    // Una data nel futuro non ha senso per un'ispezione già fatta: 400.
    if (dataTrasformata.getTime() > Date.now()) {
      return res
        .status(400)
        .json({ messaggio: "la data inserita non può essere futura" });
    }
  }

  // Le note da salvare partono da null: "nessuna nota" ha un solo modo di presentarsi.
  let noteDaSalvare = null;

  // Le controlliamo solo se c'è qualcosa.
  if (note) {
    // Se non sono una stringa (es. un numero o un oggetto): 400.
    if (typeof note !== "string") {
      return res
        .status(400)
        .json({ messaggio: "le note devono essere delle stringhe" });
    }

    // Se tolti gli spazi resta del testo, salviamo il testo ripulito; altrimenti restano null.
    if (note.trim() !== "") {
      noteDaSalvare = note.trim();
    }
  }

  // L'id ha la forma giusta, ma l'asset esiste davvero? Lo chiediamo al database.
  const assetEsistente = await pool.query("SELECT id FROM assets WHERE id=$1", [
    asset_id,
  ]);

  // Nessuna riga = l'asset non esiste: 404 (senza questo controllo lo bloccherebbe
  // la chiave esterna, ma il client riceverebbe un 500 generico).
  if (assetEsistente.rows.length === 0) {
    return res.status(404).json({ messaggio: "asset non esistente" });
  }

  // ── CARICAMENTO DELLE FOTO SU CLOUDINARY ──
  // Sta dopo la portineria (una busta sbagliata non carica niente) e prima della transazione
  // (il caricamento passa da internet e non deve tenere occupata la connessione del database).

  // La scatola dove mettiamo, per ogni foto caricata, la sua etichetta e il suo indirizzo.
  // Sta fuori dal try perché la usiamo nella transazione. È const anche se ci facciamo push:
  // const vieta di sostituire la scatola, non di metterci dentro le cose.
  const fotoCaricate = [];
  try {
    // Un giro per ogni foto arrivata. for...of aspetta ogni caricamento prima del successivo.
    for (const file of req.files) {
      // La foto è nel buffer (i suoi byte). Cloudinary la accetta come data URI:
      // "data:" + il tipo + ";base64," + i byte trasformati in testo base64.
      let fotoComeTesto = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
      // Spedisce la foto a Cloudinary nella cartella "ispezioni" e aspetta la risposta:
      // un oggetto che descrive la foto salvata (public_id, dimensioni, peso, indirizzi...).
      const risultato = await cloudinary.uploader.upload(fotoComeTesto, {
        folder: "ispezioni",
      });
      // Teniamo due cose: l'etichetta, per sapere di quale difetto è,
      // e secure_url, l'indirizzo pubblico in https che salveremo nella tabella foto.
      fotoCaricate.push({
        fieldname: file.fieldname,
        url: risultato.secure_url,
      });
    }
  } catch (error) {
    // Cloudinary non ha risposto o ha rifiutato una foto.
    // 502 = il nostro server sta bene, ha fallito un servizio a cui ci appoggiamo.
    // Nel database non è ancora entrato niente, perché la transazione non è partita.
    console.log(error);
    return res
      .status(502)
      .json({ messaggio: "caricamento delle foto non riuscito, riprova" });
  }

  // Provvisorio: stampa nel terminale del server le foto caricate.
  console.log(fotoCaricate);

  // ── TRANSAZIONE: ispezione, difetti e foto si salvano tutti insieme o per niente ──

  // Prendiamo in prestito UNA connessione dal pool, solo dopo la portineria
  // (le buste respinte non la occupano) e fuori dal try (se fallisce non c'è niente da restituire).
  // Serve la stessa connessione per tutte le query, perché BEGIN vale solo per lei.
  const connessione = await pool.connect();

  try {
    // Apre il pacchetto: da qui in poi niente è definitivo fino al COMMIT.
    await connessione.query("BEGIN");

    // Scrive l'ispezione. Non nominiamo id e validazione, così scattano i loro default.
    // COALESCE($5, NOW()): usa la data arrivata, e se è null usa l'ora del database.
    // data ?? null trasforma undefined (data assente) in null.
    // RETURNING id ci restituisce l'id appena creato.
    const risultato = await connessione.query(
      "INSERT INTO ispezioni(asset_id,utente_id,esito,note,data) VALUES($1,$2,$3,$4,COALESCE($5,NOW())) RETURNING id",
      [asset_id, utente_id, esito, noteDaSalvare, data ?? null],
    );

    // L'id della nuova ispezione (arriva come stringa, perché la colonna è bigint).
    const ispezioneId = risultato.rows[0].id;

    // Un giro per ogni difetto. Usiamo il for con l'indice (e non for...of) perché ci serve
    // la posizione i del difetto: è il numero che compare nelle etichette delle sue foto.
    // Come for...of, aspetta ogni await prima del giro dopo (forEach no).
    // Se l'esito è conforme l'array è vuoto e il ciclo non gira.
    for (let i = 0; i < difetti.length; i++) {
      // Scrive il difetto con l'id dell'ispezione e si fa restituire il suo id con RETURNING.
      const risultatoDifetto = await connessione.query(
        "INSERT INTO difetti(ispezione_id,descrizione,severita) VALUES($1,$2,$3) RETURNING id",
        [ispezioneId, difetti[i].descrizione, difetti[i].severita],
      );

      // L'id del difetto appena nato: le sue foto devono puntare a lui.
      const difettoId = risultatoDifetto.rows[0].id;

      // Tra tutte le foto già caricate, tiene solo quelle di questo difetto (etichetta "foto-" + i).
      const fotoDelDifetto = fotoCaricate.filter((foto) => {
        return foto.fieldname === `foto-${i}`;
      });

      // Una riga in foto per ognuna, con l'id del difetto e l'indirizzo Cloudinary.
      // Se il difetto non ha foto, l'array è vuoto e il ciclo non gira.
      for (const foto of fotoDelDifetto) {
        await connessione.query(
          "INSERT INTO foto(difetto_id,url) VALUES($1,$2)",
          [difettoId, foto.url],
        );
      }
    }

    // Conferma il pacchetto: ora ispezione, difetti e foto sono salvati davvero.
    await connessione.query("COMMIT");
    // 201 = creato, con l'id della nuova ispezione.
    res.status(201).json({ id: ispezioneId });
  } catch (error) {
    // Se una qualsiasi query del pacchetto fallisce: stampiamo il motivo nel terminale,
    // annulliamo tutto con ROLLBACK (nel database non resta niente) e rispondiamo 500.
    console.error(error);
    await connessione.query("ROLLBACK");
    res.status(500).json({ messaggio: "errore nel salvataggio" });
  } finally {
    // Gira SEMPRE, sia dopo il try sia dopo il catch:
    // riconsegna la connessione al pool, altrimenti dopo dieci richieste il server si blocca.
    connessione.release();
  }
});

// Esporta il router, che index.js monta su /api/ispezioni.
export default routerIspezioni;
