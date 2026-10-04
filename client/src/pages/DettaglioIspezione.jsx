import { useEffect } from "react";
import { useState } from "react";
import { Link, useParams } from "react-router";

const classiStileEsito = {
  conforme: "bg-green-50 text-green-800 ring-green-200",
  conforme_con_riserva: "bg-amber-50 text-amber-900 ring-amber-200",
  non_conforme: "bg-red-50 text-red-800 ring-red-200",
};

const etichetteEsito = {
  conforme: "Conforme",
  conforme_con_riserva: "Conforme con riserva",
  non_conforme: "Non conforme",
};

const etichetteValidazione = {
  in_sospeso: "In sospeso",
  accettata: "Accettata",
  rifiutata: "Rifiutata",
};

const classiStiliSeverita = {
  lieve: "bg-slate-100 text-slate-700 ring-slate-200",
  media: "bg-amber-50 text-amber-900 ring-amber-200",
  grave: "bg-red-50 text-red-800 ring-red-200",
};

const etichettaSeverita = {
  lieve: "Lieve",
  media: "Media",
  grave: "Grave",
};

export default function DettaglioIspezione() {
  const [ispezione, setIspezione] = useState(null);
  const [caricamento, setCaricamento] = useState(true);
  const [errore, setErrore] = useState(null);
  const [nonTrovata, setNonTrovata] = useState(false);

  const [erroreValidazione, setErroreValidazione] = useState(null);
  const [invioInCorso, setInvioInCorso] = useState(false);
  const params = useParams();
  const id = params.id;

  const getIspezione = async () => {
    setIspezione(null);
    setCaricamento(true);
    setErrore(null);
    setNonTrovata(false);
    try {
      const risposta = await fetch(`http://localhost:3000/api/ispezioni/${id}`);
      if (!risposta.ok) {
        if (risposta.status === 404 || risposta.status === 400) {
          setNonTrovata(true);
          return;
        }
        throw new Error("Errore nel caricamento dell'ispezione");
      }

      const dati = await risposta.json();
      setIspezione(dati.ispezione);
    } catch (error) {
      console.error(error);
      setErrore(error.message);
    } finally {
      setCaricamento(false);
    }
  };

  const modificaValidazione = async (validazione) => {
    setInvioInCorso(true);
    setErroreValidazione(null);
    try {
      const risposta = await fetch(
        `http://localhost:3000/api/ispezioni/${id}`,
        {
          method: "PATCH",
          headers: { "Content-type": "application/json" },
          body: JSON.stringify({ validazione: `${validazione}` }),
        },
      );
      if (!risposta.ok) {
        throw new Error("Errore nella validazione");
      }
      const dati = await risposta.json();
      setIspezione({ ...ispezione, validazione: dati.validazione });
    } catch (error) {
      console.error(error);
      setErroreValidazione(error.message);
    } finally {
      setInvioInCorso(false);
    }
  };

  useEffect(() => {
    getIspezione();
  }, [id]);

  if (caricamento) {
    return (
      <main className="mx-auto max-w-4xl p-8">
        <p
          role="status"
          className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500"
        >
          Caricamento dell'ispezione…
        </p>
      </main>
    );
  }

  if (nonTrovata) {
    return (
      <main className="mx-auto max-w-4xl p-8">
        <div className="rounded-lg border border-dashed border-slate-300 px-4 py-10 text-center">
          <h1 className="text-lg font-semibold text-slate-900">
            Ispezione non trovata
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Potrebbe essere stata eliminata, oppure l'indirizzo non è corretto.
          </p>
          <Link
            to="/supervisore"
            className="mt-4 inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            Torna al Registro
          </Link>
        </div>
      </main>
    );
  }

  if (errore) {
    return (
      <main className="mx-auto max-w-4xl p-8">
        <Link
          to="/supervisore"
          className="text-sm text-blue-700 hover:underline"
        >
          ← Torna al Registro
        </Link>
        <div
          role="alert"
          className="mt-4 flex flex-col gap-3 rounded-lg border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="text-sm text-red-800">
            Non siamo riusciti a caricare l'ispezione. Controlla la connessione
            e riprova.
          </p>
          <button
            type="button"
            className="shrink-0 cursor-pointer rounded-md bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700"
            onClick={() => getIspezione()}
          >
            Riprova
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl p-8">
      <Link to="/supervisore" className="text-sm text-blue-700 hover:underline">
        ← Torna al Registro
      </Link>

      <header className="mt-4 flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm text-slate-500">Ispezione n. {ispezione.id}</p>
          <h1 className="mt-1 text-3xl font-bold text-slate-900">
            {ispezione.nome_asset}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {ispezione.tipologia} · {ispezione.indirizzo} ·{" "}
            {ispezione.nome_zona}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-block whitespace-nowrap rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${classiStileEsito[ispezione.esito]}`}
          >
            {etichetteEsito[ispezione.esito]}
          </span>
          <span className="inline-block rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-xs text-slate-600">
            {etichetteValidazione[ispezione.validazione]}
          </span>
        </div>
      </header>

      <dl className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-xs uppercase tracking-wide text-slate-500">
            Data
          </dt>
          <dd className="mt-1 text-slate-900">
            {new Date(ispezione.data).toLocaleString("it-IT", {
              dateStyle: "long",
              timeStyle: "short",
            })}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-slate-500">
            Operatore
          </dt>
          <dd className="mt-1 text-slate-900">{ispezione.nome_utente}</dd>
        </div>
      </dl>

      <section className="mt-8" aria-labelledby="titolo-note">
        <h2 id="titolo-note" className="text-lg font-semibold text-slate-900">
          Note dell'operatore
        </h2>
        <p className="mt-2 whitespace-pre-line rounded-lg bg-slate-50 p-4 text-sm text-slate-700">
          {ispezione.note}
        </p>
      </section>

      <section className="mt-8" aria-labelledby="titolo-difetti">
        <h2
          id="titolo-difetti"
          className="text-lg font-semibold text-slate-900"
        >
          Difetti rilevati
        </h2>

        {ispezione.difetti.length === 0 && (
          <p className="mt-2 rounded-lg border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500">
            Nessun difetto rilevato durante l'ispezione.
          </p>
        )}

        {ispezione.difetti.length !== 0 && (
          <ul className="mt-3 space-y-4">
            {ispezione.difetti.map((difetto) => {
              return (
                <li
                  key={difetto.id}
                  className="rounded-lg border border-slate-200 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-medium text-slate-900">
                      {difetto.descrizione}
                    </p>
                    <span
                      className={`shrink-0 rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${classiStiliSeverita[difetto.severita]}`}
                    >
                      {etichettaSeverita[difetto.severita]}
                    </span>
                  </div>

                  {/* un <li> interno per foto */}
                  <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {difetto.foto.map((foto, indice) => {
                      return (
                        <li key={foto.id}>
                          <a
                            href={foto.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block overflow-hidden rounded-md ring-1 ring-slate-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                          >
                            <img
                              src={foto.url}
                              alt={`Foto ${indice + 1} del difetto: ${difetto.descrizione}`}
                              loading="lazy"
                              width="640"
                              height="480"
                              className="aspect-[4/3] w-full object-cover"
                            />
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              );
            })}
          </ul>
        )}
      </section>
      {ispezione.validazione === "in_sospeso" && (
        <section
          className="mt-8 border-t border-slate-200 pt-6"
          aria-labelledby="titolo-validazione"
        >
          <h2
            id="titolo-validazione"
            className="text-lg font-semibold text-slate-900"
          >
            Validazione
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            La decisione è definitiva: una volta confermata non si può
            modificare.
          </p>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <button
              disabled={invioInCorso}
              type="button"
              className="cursor-pointer rounded-md bg-green-700 px-4 py-2 text-sm font-medium text-white enabled:hover:bg-green-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-700 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => modificaValidazione("accettata")}
            >
              Accetta
            </button>
            <button
              disabled={invioInCorso}
              type="button"
              className="cursor-pointer rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 enabled:hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => modificaValidazione("rifiutata")}
            >
              Rifiuta
            </button>
          </div>

          {erroreValidazione && (
            <p
              role="alert"
              className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
            >
              Non siamo riusciti a salvare la decisione. Riprova.
            </p>
          )}
        </section>
      )}
    </main>
  );
}
