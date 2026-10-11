import { useEffect, useState } from "react";
import {
  esitoIspezioni,
  classiStileEsito,
  classiPalliniEsito,
  prioritaEsiti,
} from "../costanti/esiti";
import { Link } from "react-router";

const zonaMunicipio = 1;

export default function SupervisoreDaGestire() {
  const [statoAsset, setStatoAsset] = useState([]);
  const [caricamento, setCaricamento] = useState(true);
  const [errore, setErrore] = useState(null);

  const getStatoAsset = async () => {
    try {
      setCaricamento(true);
      setErrore(null);
      const token = localStorage.getItem("token");
      const risposta = await fetch(
        `http://localhost:3000/api/ispezioni/stato-asset?zona=${zonaMunicipio}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!risposta.ok) {
        throw new Error(
          "Qualcosa è andato storto durante il caricamento dei dati",
        );
      }
      const dati = await risposta.json();
      setStatoAsset(dati.statoAsset);
    } catch (error) {
      console.error(error);
      setErrore(error.message);
    } finally {
      setCaricamento(false);
    }
  };

  useEffect(() => {
    getStatoAsset();
  }, []);

  const statoAssetSorted = [...statoAsset].sort((a, b) => {
    const prioritaA = a.id_ispezione ? prioritaEsiti[a.esito] : 3;
    const prioritaB = b.id_ispezione ? prioritaEsiti[b.esito] : 3;
    return prioritaA - prioritaB;
  });
  console.log(statoAssetSorted);
  return (
    <>
      <header className="mt-6 mb-6">
        <h2 className="text-xl font-semibold text-slate-900">Da gestire</h2>
        <p className="mt-1 text-sm text-slate-500">
          Stato attuale degli asset della zona, in base all'ultima ispezione
        </p>
      </header>
      {caricamento && (
        <p className="py-12 text-center text-sm text-slate-500">
          Caricamento degli asset…
        </p>
      )}

      {errore && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {errore}
        </div>
      )}

      {statoAsset.length === 0 && !caricamento && !errore && (
        <p className="py-12 text-center text-sm text-slate-500">
          Nessun asset in questa zona
        </p>
      )}

      {statoAsset.length > 0 && (
        <ul className="divide-y divide-slate-200 overflow-hidden rounded-lg border border-slate-200 bg-white">
          {statoAssetSorted.map((asset) => {
            if (asset.id_ispezione) {
              return (
                <li key={asset.id_asset}>
                  <Link
                    to={`/supervisore/ispezioni/${asset.id_ispezione}`}
                    className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-slate-50 focus-visible:bg-slate-50 focus-visible:outline-none"
                  >
                    <span
                      className={`size-3 shrink-0 rounded-full ${classiPalliniEsito[asset.esito]}`}
                      aria-hidden="true"
                    ></span>
                    <span className="flex-1 truncate font-medium text-slate-900">
                      {asset.nome}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${classiStileEsito[asset.esito]}`}
                    >
                      {esitoIspezioni[asset.esito]}
                    </span>
                    <time className="w-24 shrink-0 text-right text-sm tabular-nums text-slate-500">
                      {new Date(asset.data).toLocaleDateString("it-IT")}
                    </time>
                  </Link>
                </li>
              );
            }
            return (
              <li
                key={asset.id_asset}
                className="flex items-center gap-4 px-4 py-3"
              >
                <span
                  className="size-3 shrink-0 rounded-full bg-slate-300"
                  aria-hidden="true"
                ></span>
                <span className="flex-1 truncate font-medium text-slate-500">
                  {asset.nome}
                </span>
                <span className="text-sm italic text-slate-400">
                  Mai ispezionato
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
