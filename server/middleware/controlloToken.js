import jwt from "jsonwebtoken";
const controlloToken = (req, res, next) => {
  try {
    const autorizzazione = req.headers.authorization;
    if (!req.headers.authorization || !autorizzazione.startsWith("Bearer "))
      return res.status(401).json({ messaggio: "Autorizzazione mancante" });

    const token = autorizzazione.split(" ")[1];
    const chiaveSegreta = process.env.JWT_SECRET;
    const datiUtente = jwt.verify(token, chiaveSegreta);
    req.utente = datiUtente;
    next();
  } catch (error) {
    return res.status(401).json({ messaggio: "Errore nell'autenticazione" });
  }
};

export default controlloToken;
