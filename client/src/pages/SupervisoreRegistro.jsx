import { useEffect, useState } from "react";
import { Link } from "react-router";
import {
  esitoIspezioni,
  classiStileEsito,
  validazioneIspezioni,
} from "../costanti/esiti";

const filtriIniziali = {
  esito: "",
  operatore: "",
  validazione: "",
  dataDa: "",
  dataAl: "",
};

export default function SupervisoreRegistro() {
  const [ispezioni, setIspezioni] = useState([]);
  const [errore, setErrore] = useState(null);
  const [caricamento, setCaricamento] = useState(true);

  const [filtri, setFiltri] = useState(filtriIniziali);

  const utentiId = new Set();
  const ispezioniPerOperatore = ispezioni.filter((ispezione) => {
    if (utentiId.has(ispezione.utente_id)) return false;
    utentiId.add(ispezione.utente_id);
    return true;
  });

  const getIspezioni = async () => {
    try {
      setCaricamento(true);
      setErrore(null);
      const token = localStorage.getItem("token");
      const risposta = await fetch(`http://localhost:3000/api/ispezioni`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!risposta.ok) {
        throw new Error("qualcosa è andato storto durante il caricamento");
      }
      const dati = await risposta.json();
      setIspezioni(dati.ispezioni);
    } catch (error) {
      console.error(error);
      setErrore(error.message);
    } finally {
      setCaricamento(false);
    }
  };

  useEffect(() => {
    getIspezioni();
  }, []);

  const ispezioniFiltrate = ispezioni.filter((ispezione) => {
    const quando = new Date(ispezione.data);
    const anno = quando.getFullYear();
    const mese = String(quando.getMonth() + 1).padStart(2, "0");
    const giorno = String(quando.getDate()).padStart(2, "0");
    const giornoIspezione = `${anno}-${mese}-${giorno}`;

    if (filtri.esito !== "" && filtri.esito !== ispezione.esito) return false;
    if (filtri.operatore !== "" && filtri.operatore !== ispezione.utente_id)
      return false;
    if (
      filtri.validazione !== "" &&
      filtri.validazione !== ispezione.validazione
    )
      return false;
    if (filtri.dataDa !== "" && filtri.dataDa > giornoIspezione) return false;
    if (filtri.dataAl !== "" && filtri.dataAl < giornoIspezione) return false;

    return true;
  });

  return (
    <>
      <div className="mt-6 grid grid-cols-1 gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label
            htmlFor="filtro-operatore"
            className="block text-xs font-medium uppercase tracking-wide text-slate-500"
          >
            Operatore
          </label>
          <select
            value={filtri.operatore}
            onChange={(e) =>
              setFiltri({ ...filtri, operatore: e.target.value })
            }
            id="filtro-operatore"
            className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            <option value="">Tutti</option>
            {ispezioniPerOperatore.map((operatore) => {
              return (
                <option key={operatore.utente_id} value={operatore.utente_id}>
                  {operatore.nome_utente}
                </option>
              );
            })}
          </select>
        </div>

        <div>
          <label
            htmlFor="filtro-esito"
            className="block text-xs font-medium uppercase tracking-wide text-slate-500"
          >
            Esito
          </label>
          <select
            onChange={(e) => setFiltri({ ...filtri, esito: e.target.value })}
            value={filtri.esito}
            id="filtro-esito"
            className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            <option value="">Tutti</option>
            {Object.entries(esitoIspezioni).map(([key, value]) => {
              return (
                <option key={key} value={key}>
                  {value}
                </option>
              );
            })}
          </select>
        </div>

        <div>
          <label
            htmlFor="filtro-validazione"
            className="block text-xs font-medium uppercase tracking-wide text-slate-500"
          >
            Validazione
          </label>
          <select
            onChange={(e) =>
              setFiltri({ ...filtri, validazione: e.target.value })
            }
            value={filtri.validazione}
            id="filtro-validazione"
            className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            <option value="">Tutte</option>
            {Object.entries(validazioneIspezioni).map(([key, value]) => {
              return (
                <option key={key} value={key}>
                  {value}
                </option>
              );
            })}
          </select>
        </div>

        <fieldset>
          <legend className="block text-xs font-medium uppercase tracking-wide text-slate-500">
            Data
          </legend>
          <div className="mt-1 grid grid-cols-2 gap-2">
            <label className="sr-only" htmlFor="filtro-data-dal">
              Dal
            </label>
            <input
              onChange={(e) => setFiltri({ ...filtri, dataDa: e.target.value })}
              value={filtri.dataDa}
              max={filtri.dataAl}
              id="filtro-data-dal"
              type="date"
              className="block w-full rounded-md border border-slate-300 bg-white px-2 py-2 text-sm text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            />
            <label className="sr-only" htmlFor="filtro-data-al">
              Al
            </label>
            <input
              onChange={(e) => setFiltri({ ...filtri, dataAl: e.target.value })}
              value={filtri.dataAl}
              min={filtri.dataDa}
              id="filtro-data-al"
              type="date"
              className="block w-full rounded-md border border-slate-300 bg-white px-2 py-2 text-sm text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            />
          </div>
        </fieldset>
      </div>
      <div className="mt-4 flex items-center justify-between gap-4">
        <p className="text-sm text-slate-600">
          {ispezioniFiltrate.length === 1
            ? `Numero di ispezione: ${ispezioniFiltrate.length}`
            : `Numero di ispezioni: ${ispezioniFiltrate.length}`}
        </p>
        {(filtri.dataAl !== "" ||
          filtri.dataDa !== "" ||
          filtri.esito !== "" ||
          filtri.operatore !== "" ||
          filtri.validazione !== "") && (
          <button
            type="button"
            className="cursor-pointer rounded-sm text-sm font-medium text-blue-700 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            onClick={() => setFiltri(filtriIniziali)}
          >
            Azzera filtri
          </button>
        )}
      </div>

      {caricamento && !errore && ispezioni.length === 0 && (
        <p
          role="status"
          className="mt-6 rounded-lg border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500"
        >
          Caricamento delle ispezioni…
        </p>
      )}

      {!caricamento && errore && ispezioni.length === 0 && (
        <div
          role="alert"
          className="mt-6 flex flex-col gap-3 rounded-lg border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="text-sm text-red-800">
            Non siamo riusciti a caricare le ispezioni. Controlla la connessione
            e riprova.
          </p>
          <button
            onClick={() => {
              getIspezioni();
            }}
            type="button"
            className="shrink-0 cursor-pointer rounded-md bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700"
          >
            Riprova
          </button>
        </div>
      )}

      {!caricamento && !errore && ispezioni.length === 0 && (
        <div className="mt-6 rounded-lg border border-dashed border-slate-300 px-4 py-10 text-center">
          <p className="text-sm font-medium text-slate-700">
            Nessuna ispezione in questo municipio
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Quando gli operatori chiuderanno un rapporto, lo vedrai qui.
          </p>
        </div>
      )}

      {ispezioniFiltrate.length === 0 && ispezioni.length > 0 && (
        <div className="mt-6 rounded-lg border border-dashed border-slate-300 px-4 py-10 text-center">
          <p className="text-sm font-medium text-slate-700">
            Nessuna ispezione corrisponde ai filtri
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Prova ad allargare l'intervallo di date o a togliere qualche filtro.
          </p>
          <button
            onClick={() => setFiltri(filtriIniziali)}
            type="button"
            className="mt-4 cursor-pointer rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            Azzera filtri
          </button>
        </div>
      )}

      {ispezioniFiltrate.length > 0 && (
        <div className="mt-6 overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">
                  Data
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Esito
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Asset
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Municipio
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Operatore
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ispezioniFiltrate.map((ispezione) => {
                return (
                  <tr key={ispezione.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 align-top">
                      <span className="block whitespace-nowrap text-slate-900">
                        {new Date(ispezione.data).toLocaleDateString("it-IT")}
                      </span>
                      <span className="mt-1 inline-block rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-xs text-slate-600">
                        {validazioneIspezioni[ispezione.validazione]}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <span
                        className={`inline-block whitespace-nowrap rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${classiStileEsito[ispezione.esito]}`}
                      >
                        {esitoIspezioni[ispezione.esito]}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <Link
                        to={`/supervisore/ispezioni/${ispezione.id}`}
                        className="block rounded-sm font-medium text-slate-900 hover:text-blue-700 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                      >
                        {ispezione.nome_asset}
                      </Link>
                      <span className="block text-xs text-slate-500">
                        {ispezione.tipologia} · {ispezione.indirizzo}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 align-top text-slate-700">
                      {ispezione.nome_zona}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 align-top text-slate-700">
                      {ispezione.nome_utente}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
