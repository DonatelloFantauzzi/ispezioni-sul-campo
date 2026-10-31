export default function soloRuoli(ruoli) {
  return (req, res, next) => {
    const ruolo = req.utente.ruolo;
    if (!ruoli.includes(ruolo)) {
      return res
        .status(403)
        .json({ messaggio: "Non hai i permessi per questa operazione" });
    }
    next();
  };
}
