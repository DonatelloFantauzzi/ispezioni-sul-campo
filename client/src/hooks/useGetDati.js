import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
export default function useGetDati(url, valoreIniziale) {
  const [dati, setDati] = useState(valoreIniziale);
  const [caricamento, setCaricamento] = useState(true);
  const [errore, setErrore] = useState(null);
  const [stato, setStato] = useState(null);

  const navigate = useNavigate();

  const getDati = async () => {
    setDati(valoreIniziale);
    setCaricamento(true);
    setErrore(null);
    setStato(null);
    try {
      const token = localStorage.getItem("token");
      const risposta = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStato(risposta.status);
      if (risposta.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("ruolo");
        return navigate("/login", { replace: true });
      }
      if (!risposta.ok) {
        throw new Error("Errore nel caricamento dei dati");
      }

      const datiFetch = await risposta.json();
      setDati(datiFetch);
    } catch (error) {
      console.error(error);
      setErrore(error.message);
    } finally {
      setCaricamento(false);
    }
  };

  useEffect(() => {
    if (!url) return;
    getDati();
  }, [url]);

  return { dati, caricamento, errore, stato, setDati, getDati };
}
