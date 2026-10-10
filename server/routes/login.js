import express from "express";
import pool from "../db/pool.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const routerLogin = express.Router();

routerLogin.post("/", async (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  if (!email || !password)
    return res.status(400).json({ messaggio: "mail o password mancanti" });

  try {
    const utente = await pool.query(
      `SELECT id,ruolo,zona_id,password_hash FROM utenti WHERE email=$1`,
      [email],
    );

    if (utente.rows.length === 0)
      return res.status(401).json({ messaggio: "Credenziali non valide" });
    const passwordComparata = await bcrypt.compare(
      password,
      utente.rows[0].password_hash,
    );

    if (!passwordComparata)
      return res.status(401).json({ messaggio: "Credenziali non valide" });

    const datiUtente = {
      id: utente.rows[0].id,
      ruolo: utente.rows[0].ruolo,
      zona: utente.rows[0].zona_id,
    };

    const chiaveSegreta = process.env.JWT_SECRET;

    const token = jwt.sign(datiUtente, chiaveSegreta, { expiresIn: "8h" });
    return res.status(200).json({ token, ruolo: utente.rows[0].ruolo });
  } catch (error) {
    return res
      .status(500)
      .json({ messaggio: "C'è stato un errore imprevisto" });
  }
});

export default routerLogin;
