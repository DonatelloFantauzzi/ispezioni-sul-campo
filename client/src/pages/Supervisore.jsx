import { useEffect, useState } from "react";
import { Link } from "react-router";

const zonaProvvisoria = 1;

const classiStileEsito = {
  conforme: "bg-green-50 text-green-800 ring-green-200",
  conforme_con_riserva: "bg-amber-50 text-amber-900 ring-amber-200",
  non_conforme: "bg-red-50 text-red-800 ring-red-200",
};

const esitoIspezioni = {
  conforme: "Conforme",
  conforme_con_riserva: "Conforme con riserva",
  non_conforme: "Non conforme",
};

const validazioneIspezioni = {
  in_sospeso: "In sospeso",
  accettata: "Accettata",
  rifiutata: "Rifiutata",
};

export default function Supervisore() {
  const [ispezioni, setIspezioni] = useState([]);
  const [errore, setErrore] = useState(null);
  const [caricamento, setCaricamento] = useState(true);

  const getIspezioni = async () => {
    try {
      const risposta = await fetch(
        `http://localhost:3000/api/ispezioni?zona=${zonaProvvisoria}`,
      );
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

  return (
    <main className="mx-auto max-w-6xl p-8">
      <h1 className="text-3xl font-bold text-blue-600">
        Dashboard supervisore
      </h1>

      <div
        role="tablist"
        aria-label="Sezioni della dashboard"
        className="mt-6 flex gap-2 border-b border-slate-200"
      >
        <button
          type="button"
          role="tab"
          aria-selected="false"
          className="-mb-px border-b-2 border-transparent px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-700"
        >
          Da gestire
        </button>
        <button
          type="button"
          role="tab"
          aria-selected="true"
          className="-mb-px border-b-2 border-blue-600 px-4 py-2 text-sm font-medium text-blue-600"
        >
          Registro ispezioni
        </button>
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
              setCaricamento(true);
              setErrore(null);
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

      {ispezioni.length !== 0 && (
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
              {/* una <tr> per ispezione */}
              {ispezioni.map((ispezione) => {
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
    </main>
  );
}
