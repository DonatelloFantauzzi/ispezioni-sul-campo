import { useEffect, useState } from "react";
import Mappa from "./components/Mappa";

export default function App() {
  const [assets, setAssets] = useState([]);
  const [caricamento, setCaricamento] = useState(true);
  const [errore, setErrore] = useState(null);

  useEffect(() => {
    const getAssets = async () => {
      try {
        setCaricamento(true);
        setErrore(null);
        const risposta = await fetch(
          "http://localhost:3000/api/assets?lat=41.9&lng=12.5&raggio=1000",
        );
        if (!risposta.ok) {
          throw new Error("qualcosa è andato storto nel caricamento");
        }
        const data = await risposta.json();
        setAssets(data.assets);
      } catch (error) {
        console.error(error);
        setErrore(error.message);
      } finally {
        setCaricamento(false);
      }
    };

    getAssets();
  }, []);
  return (
    <>
      <h1 className="text-3xl font-bold text-blue-600 p-8">
        Ispezioni sul campo
      </h1>
      <Mappa assets={assets} />
    </>
  );
}
