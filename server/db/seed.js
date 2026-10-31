import pool from "./pool.js";
import bcrypt from "bcryptjs";

const tipologiaAsset = ["cabina", "traliccio", "contatore"];
const utenti = [
  {
    nome: "Mario Rossi",
    email: "mario.rossi@example.com",
    password: "Password123!",
    ruolo: "operatore",
    idMunicipio: 0,
  },
  {
    nome: "Giulia Bianchi",
    email: "giulia.bianchi@example.com",
    password: "SecurePass456!",
    ruolo: "operatore",
    idMunicipio: 1,
  },
  {
    nome: "Luca Verdi",
    email: "luca.verdi@example.com",
    password: "SuperSegreta789!",
    ruolo: "supervisore",
    idMunicipio: 0,
  },
  {
    nome: "Sara Neri",
    email: "sara.neri@example.com",
    password: "Qwerty2026!",
    ruolo: "operatore",
    idMunicipio: 2,
  },
  {
    nome: "Marco Gialli",
    email: "marco.gialli@example.com",
    password: "AdminPass999!",
    ruolo: "supervisore",
    idMunicipio: 1,
  },
  {
    nome: "Elena Russo",
    email: "elena.russo@example.com",
    password: "Municipio3Pass!",
    ruolo: "supervisore",
    idMunicipio: 2,
  },
  {
    nome: "Anna Ferri",
    email: "anna.ferri@example.com",
    password: "AdminTutto2026!",
    ruolo: "admin",
    idMunicipio: null,
  },
];

const esiti = ["conforme", "non_conforme", "conforme_con_riserva"];

const noteIspezione = [
  "Presenza di ruggine diffusa sullo sportello metallico principale e sui cardini.",
  "Vegetazione infestante troppo alta che ostruisce parzialmente l'accesso all'infrastruttura.",
  "Cartellonistica di sicurezza e avvisi di pericolo assenti o gravemente sbiaditi.",
  "Lesioni evidenti e crepe superficiali sul basamento in calcestruzzo della struttura.",
  "Tracce di umidità e possibili infiltrazioni d'acqua all'interno del vano contatori.",
  "Guaina protettiva dei cavi parzialmente deteriorata per esposizione agli agenti atmosferici.",
];

const seiMesi = 1000 * 60 * 60 * 24 * 30 * 6;
const seiMesiFa = Date.now() - seiMesi;

const descrizioneDifetti = [
  "Ruggine diffusa sullo sportello metallico",
  "Crepa sul basamento in calcestruzzo",
  "Guaina dei cavi deteriorata",
  "Infiltrazioni d'acqua nel vano contatori",
  "Cartellonistica di sicurezza illeggibile",
];

const difettiLieviMedi = ["lieve", "media"];
const difettiMediGravi = ["media", "grave"];

const vieNord = [
  "Via Flaminia",
  "Viale Parioli",
  "Via Salaria",
  "Corso Francia",
  "Via Nomentana",
  "Viale Somalia",
  "Via Cassia",
  "Viale Libia",
];

const vieCentro = [
  "Via del Corso",
  "Via Nazionale",
  "Via Cavour",
  "Via Merulana",
  "Via Labicana",
  "Viale Trastevere",
  "Via Gregorio VII",
  "Via Prenestina",
];

const vieSud = [
  "Via Ostiense",
  "Via Appia Nuova",
  "Via Cristoforo Colombo",
  "Viale Marconi",
  "Via Laurentina",
  "Via Tuscolana",
  "Viale Europa",
  "Via Portuense",
];

const seed = async () => {
  await pool.query("TRUNCATE assets,utenti RESTART IDENTITY CASCADE");
  const municipi = (await pool.query("SELECT nome,id FROM zone ORDER BY id"))
    .rows;
  for (let i = 0; i < 100; i++) {
    const tipologia = tipologiaAsset[Math.floor(Math.random() * 3)];
    const lng = Math.random() * 0.2 + 12.4;
    const lat = Math.random() * 0.2 + 41.8;
    let zonaId;
    let indirizzo;
    if (lat >= 41.8 && lat <= 41.8667) {
      zonaId = municipi[2].id;
      indirizzo = `${vieSud[Math.floor(Math.random() * vieSud.length)]} ${Math.floor(Math.random() * 200 + 1)}`;
    } else if (lat > 41.8667 && lat <= 41.9333) {
      zonaId = municipi[1].id;
      indirizzo = `${vieCentro[Math.floor(Math.random() * vieCentro.length)]} ${Math.floor(Math.random() * 200 + 1)}`;
    } else {
      zonaId = municipi[0].id;
      indirizzo = `${vieNord[Math.floor(Math.random() * vieNord.length)]} ${Math.floor(Math.random() * 200 + 1)}`;
    }
    const nome = `${tipologia}-${i}`;
    await pool.query(
      `INSERT INTO assets(nome,geom,indirizzo,tipologia,zona_id) VALUES ($1, ST_SetSRID(ST_MakePoint($2, $3), 4326) , $4, $5,$6)`,
      [nome, lng, lat, indirizzo, tipologia, zonaId],
    );
  }

  for (let i = 0; i < utenti.length; i++) {
    const { nome, ruolo, email, password, idMunicipio } = utenti[i];
    const hashata = await bcrypt.hash(password, 10);
    const zonaId = idMunicipio === null ? null : municipi[idMunicipio].id;

    await pool.query(
      "INSERT INTO utenti(nome,password_hash,ruolo,email,zona_id) VALUES ($1,$2,$3,$4,$5)",
      [nome, hashata, ruolo, email, zonaId],
    );
  }

  const operatori = (
    await pool.query("SELECT id FROM utenti WHERE ruolo='operatore'")
  ).rows;
  const assets = (await pool.query("SELECT id FROM assets")).rows;

  for (let i = 0; i < 150; i++) {
    const utenteRandom =
      operatori[Math.floor(Math.random() * operatori.length)].id;
    const assetRandom = assets[Math.floor(Math.random() * assets.length)].id;
    const esitoRandom = esiti[Math.floor(Math.random() * esiti.length)];
    const noteRandom =
      noteIspezione[Math.floor(Math.random() * noteIspezione.length)];
    const dataRandom = new Date(
      Math.floor(Math.random() * seiMesi + seiMesiFa),
    );
    await pool.query(
      "INSERT INTO ispezioni(utente_id,asset_id,esito,note,data) VALUES($1,$2,$3,$4,$5)",
      [utenteRandom, assetRandom, esitoRandom, noteRandom, dataRandom],
    );
  }

  const ispezioniConDifetti = (
    await pool.query(
      "SELECT id,esito FROM ispezioni WHERE esito IN('non_conforme','conforme_con_riserva')",
    )
  ).rows;

  for (let i = 0; i < ispezioniConDifetti.length; i++) {
    const ispezioneId = ispezioniConDifetti[i].id;
    const numeroDifetti = Math.floor(Math.random() * 3) + 1;
    for (let k = 0; k < numeroDifetti; k++) {
      const descrizioneDifettiRandom =
        descrizioneDifetti[
          Math.floor(Math.random() * descrizioneDifetti.length)
        ];
      if (ispezioniConDifetti[i].esito === "conforme_con_riserva") {
        const difettiLieviMediRandom =
          difettiLieviMedi[Math.floor(Math.random() * difettiLieviMedi.length)];

        const risultatoDifetto = await pool.query(
          "INSERT INTO difetti(ispezione_id,descrizione,severita) VALUES($1,$2,$3) RETURNING id",
          [ispezioneId, descrizioneDifettiRandom, difettiLieviMediRandom],
        );

        const difettoID = risultatoDifetto.rows[0].id;
        const numeroFoto = Math.floor(Math.random() * 2) + 1;
        for (let j = 0; j < numeroFoto; j++) {
          const urlFoto = `https://picsum.photos/seed/${difettoID}-${j}/640/480`;
          await pool.query(`INSERT INTO foto(difetto_id,url) VALUES($1,$2)`, [
            difettoID,
            urlFoto,
          ]);
        }
      } else {
        const difettiMediGraviRandom =
          difettiMediGravi[Math.floor(Math.random() * difettiMediGravi.length)];

        const risultatoDifetto = await pool.query(
          "INSERT INTO difetti(ispezione_id,descrizione,severita) VALUES($1,$2,$3) RETURNING id",
          [ispezioneId, descrizioneDifettiRandom, difettiMediGraviRandom],
        );

        const difettoID = risultatoDifetto.rows[0].id;
        const numeroFoto = Math.floor(Math.random() * 2) + 1;
        for (let j = 0; j < numeroFoto; j++) {
          const urlFoto = `https://picsum.photos/seed/${difettoID}-${j}/640/480`;
          await pool.query(`INSERT INTO foto(difetto_id,url) VALUES($1,$2)`, [
            difettoID,
            urlFoto,
          ]);
        }
      }
    }
  }

  await pool.end();
};

seed();
