import { useEffect, useState } from "react";
import Mappa from "../components/Mappa";

const posizioneFallback = {
  lat: 41.9,
  lng: 12.5,
  stimata: true,
};

const options = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 0,
};

export default function Operatore() {
  const [assets, setAssets] = useState([]);
  const [caricamento, setCaricamento] = useState(true);
  const [errore, setErrore] = useState(null);
  const [coordinate, setCoordinate] = useState(null);

  const getAssets = async (lat, lng) => {
    try {
      setCaricamento(true);
      setErrore(null);
      const token = localStorage.getItem("token");
      const risposta = await fetch(
        `http://localhost:3000/api/assets?lat=${lat}&lng=${lng}&raggio=10000`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
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

  const successo = (position) => {
    const { latitude, longitude } = position.coords;
    setCoordinate({ lat: latitude, lng: longitude, stimata: false });
    getAssets(latitude, longitude);
  };

  const fallimento = (error) => {
    console.error(error.code, error.message);
    setCoordinate(posizioneFallback);
    getAssets(posizioneFallback.lat, posizioneFallback.lng);
  };

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(successo, fallimento, options);
  }, []);
  return (
    <>
      <h1 className="text-3xl font-bold text-blue-600 p-8">
        Ispezioni sul campo
      </h1>
      {coordinate && coordinate.stimata && (
        <div
          role="status"
          className="flex items-start gap-2 border-b border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-900"
        >
          <span aria-hidden="true">⚠️</span>
          <span>
            Non riusciamo a rilevare la tua posizione. Stiamo mostrando gli
            asset intorno al centro di Roma.
          </span>
        </div>
      )}
      {errore && (
        <div
          role="alert"
          className="mx-8 mb-4 flex flex-col gap-3 rounded-lg border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="text-sm text-red-800">
            Non siamo riusciti a caricare gli asset. Controlla la connessione e
            riprova.
          </p>
          <button
            type="button"
            className="cursor-pointer shrink-0 rounded-md bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700"
            onClick={() => getAssets(coordinate.lat, coordinate.lng)}
          >
            Riprova
          </button>
        </div>
      )}

      <Mappa
        assets={assets}
        caricamento={caricamento}
        coordinate={coordinate}
      />
    </>
  );
}
