import { useEffect, useState } from "react";
import useGetDati from "../hooks/useGetDati";
import Mappa from "../components/Mappa";
import { Link, useNavigate, useLocation } from "react-router";

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
  const [coordinate, setCoordinate] = useState(null);

  const ruolo = localStorage.getItem("ruolo");

  const { state } = useLocation();

  const navigate = useNavigate();

  const url = coordinate
    ? `http://localhost:3000/api/assets?lat=${coordinate.lat}&lng=${coordinate.lng}&raggio=10000`
    : null;

  const { dati, caricamento, errore, getDati } = useGetDati(url, {
    assets: [],
  });

  const { assets } = dati;

  const successo = (position) => {
    const { latitude, longitude } = position.coords;
    setCoordinate({ lat: latitude, lng: longitude, stimata: false });
  };

  const fallimento = (error) => {
    console.error(error.code, error.message);
    setCoordinate(posizioneFallback);
  };

  const onLogout = () => {
    localStorage.removeItem("ruolo");
    localStorage.removeItem("token");
    navigate("/", { replace: true });
  };

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(successo, fallimento, options);
  }, []);
  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-3 p-8 pb-4">
        <h1 className="text-3xl font-bold text-blue-600">
          Ispezioni sul campo
        </h1>

        <div className="flex items-center gap-3">
          {ruolo === "admin" && (
            <Link
              to="/supervisore"
              className="inline-flex min-h-11 items-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:border-blue-400 hover:text-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              Dashboard supervisore
              <span aria-hidden="true">→</span>
            </Link>
          )}

          <button
            type="button"
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
            onClick={onLogout}
          >
            Esci
          </button>
        </div>
      </header>
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
            onClick={() => getDati(coordinate.lat, coordinate.lng)}
          >
            Riprova
          </button>
        </div>
      )}

      {state && state.inviata && (
        <div
          role="status"
          className="mx-4 mt-4 flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800"
        >
          <span
            aria-hidden="true"
            className="flex size-6 shrink-0 items-center justify-center rounded-full bg-green-600 text-xs text-white"
          >
            ✓
          </span>
          Ispezione inviata
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
