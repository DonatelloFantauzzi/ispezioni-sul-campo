import { useState } from "react";
import { Link, useParams, useLocation, useNavigate } from "react-router";

export default function NuovaIspezione() {
  const [esito, setEsito] = useState("");
  const [difetti, setDifetti] = useState([]);
  const [note, setNote] = useState("");
  const [errore, setErrore] = useState(null);
  const [invioInCorso, setInvioInCorso] = useState(false);
  const [avvisoFoto, setAvvisoFoto] = useState(null);
  const params = useParams();
  const id = params.id;
  const { state } = useLocation();

  const navigate = useNavigate();

  const handleChangeEsito = (e) => {
    setEsito(e.target.value);
  };

  const handleAggiungiDifetto = () => {
    setDifetti([
      ...difetti,
      {
        id: String(Date.now()),
        severita: "",
        descrizione: "",
        foto: [],
      },
    ]);
  };

  const handleCancellaDifetto = (id) => {
    const difettiFiltrati = difetti.filter((difetto) => {
      return difetto.id !== id;
    });
    setDifetti(difettiFiltrati);
  };

  const handleModificaDifetti = (id, campo, valore) => {
    const difettiAggiornati = difetti.map((difetto) => {
      if (difetto.id === id) {
        return { ...difetto, [campo]: valore };
      }
      return difetto;
    });

    setDifetti(difettiAggiornati);
  };

  const mandaIspezione = async (ispezione) => {
    try {
      setInvioInCorso(true);
      setErrore(null);
      const token = localStorage.getItem("token");
      const risposta = await fetch(`http://localhost:3000/api/ispezioni`, {
        method: "POST",
        headers: {
          "Content-type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(ispezione),
      });
      if (risposta.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("ruolo");
        return navigate("/login", { replace: true });
      }
      const dati = await risposta.json();
      if (!risposta.ok) {
        setErrore(dati.messaggio);
        return;
      }
      navigate("/operatore", { replace: true, state: { inviata: true } });
    } catch (error) {
      console.error(error);
      setErrore("Connessione assente");
    } finally {
      setInvioInCorso(false);
    }
  };

  const handleAggiungiFoto = (id, e) => {
    const arrayFoto = Array.from(e.target.files);

    const difettoConFoto = difetti.find((difetto) => difetto.id === id);

    const postiLiberi = 3 - difettoConFoto.foto.length;

    const fotoDaAggiungere = arrayFoto.slice(0, postiLiberi);

    if (arrayFoto.length > postiLiberi) {
      setAvvisoFoto(id);
    }

    const miniatureFoto = fotoDaAggiungere.map((foto, index) => {
      return {
        id: `${Date.now()}-${index}`,
        file: foto,
        anteprima: URL.createObjectURL(foto),
      };
    });

    const difettiAggiornati = difetti.map((difetto) => {
      if (difetto.id === id) {
        return { ...difetto, foto: [...difetto.foto, ...miniatureFoto] };
      }
      return difetto;
    });

    setDifetti(difettiAggiornati);

    e.target.value = "";
  };

  const handleCancellaFoto = (difettoId, foto) => {
    URL.revokeObjectURL(foto.anteprima);
    const difettiAggiornati = difetti.map((difetto) => {
      if (difetto.id === difettoId) {
        const fotoRimaste = difetto.foto.filter((singolaFoto) => {
          return singolaFoto.id !== foto.id;
        });
        return { ...difetto, foto: fotoRimaste };
      }
      return difetto;
    });

    setDifetti(difettiAggiornati);
    setAvvisoFoto(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    let difettiModificati;
    if (esito === "conforme") {
      difettiModificati = [];
    } else {
      difettiModificati = difetti.map((difetto) => {
        return { severita: difetto.severita, descrizione: difetto.descrizione };
      });
    }

    const data = new Date().toISOString();
    const ispezione = {
      asset_id: Number(id),
      esito: esito,
      difetti: difettiModificati,
      note: note,
      data: data,
    };

    mandaIspezione(ispezione);
  };

  return (
    <main className="mx-auto max-w-lg px-4 pb-36 pt-4">
      <Link
        to="/operatore"
        className="inline-block rounded-sm py-1 text-sm text-blue-700 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
      >
        ← Mappa
      </Link>

      <header className="mt-3 border-b border-slate-200 pb-4">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Nuova ispezione
        </p>
        {/* nome dell'asset; se manca: "Asset n." + id */}
        <h1 className="mt-1 text-2xl font-bold text-slate-900">
          {!state ? `Asset n. ${id}` : state.nome}
        </h1>

        {state ? (
          <p className="mt-0.5 text-sm text-slate-600">{state.indirizzo}</p>
        ) : (
          ""
        )}
      </header>

      <form noValidate onSubmit={handleSubmit} className="mt-6 space-y-8">
        {/* ── ESITO ── */}
        <fieldset>
          <legend className="text-base font-semibold text-slate-900">
            Esito
          </legend>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <label className="flex min-h-14 cursor-pointer items-center justify-center rounded-lg border border-slate-300 bg-white px-2 text-center text-sm font-medium text-slate-700 has-checked:border-green-600 has-checked:bg-green-50 has-checked:text-green-800 has-checked:ring-1 has-checked:ring-green-600 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-blue-600">
              <input
                type="radio"
                name="esito"
                value="conforme"
                className="sr-only"
                checked={esito === "conforme"}
                onChange={handleChangeEsito}
              />
              Conforme
            </label>
            <label className="flex min-h-14 cursor-pointer items-center justify-center rounded-lg border border-slate-300 bg-white px-2 text-center text-sm font-medium text-slate-700 has-checked:border-amber-500 has-checked:bg-amber-50 has-checked:text-amber-900 has-checked:ring-1 has-checked:ring-amber-500 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-blue-600">
              <input
                type="radio"
                name="esito"
                value="conforme_con_riserva"
                className="sr-only"
                checked={esito === "conforme_con_riserva"}
                onChange={handleChangeEsito}
              />
              Con riserva
            </label>
            <label className="flex min-h-14 cursor-pointer items-center justify-center rounded-lg border border-slate-300 bg-white px-2 text-center text-sm font-medium text-slate-700 has-checked:border-red-600 has-checked:bg-red-50 has-checked:text-red-800 has-checked:ring-1 has-checked:ring-red-600 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-blue-600">
              <input
                type="radio"
                name="esito"
                value="non_conforme"
                className="sr-only"
                checked={esito === "non_conforme"}
                onChange={handleChangeEsito}
              />
              Non conforme
            </label>
          </div>
        </fieldset>

        {esito && esito !== "conforme" && (
          <section aria-labelledby="titolo-difetti">
            <div className="flex items-baseline justify-between">
              <h2
                id="titolo-difetti"
                className="text-base font-semibold text-slate-900"
              >
                Difetti
              </h2>
              {/* numero di difetti */}
              <span className="text-sm text-slate-500">{difetti.length}</span>
            </div>

            {!difetti.length && (
              <p className="mt-3 rounded-lg border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500">
                Con questo esito serve almeno un difetto.
              </p>
            )}

            {difetti.length > 0 && (
              <ul className="mt-3 space-y-4">
                {difetti.map((difetto, index) => {
                  return (
                    <li
                      key={difetto.id}
                      className="rounded-lg border border-slate-200 bg-white p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        {/* "Difetto" + numero progressivo (indice + 1) */}
                        <h3 className="text-sm font-semibold text-slate-900">
                          Difetto {index + 1}
                        </h3>
                        {/* aria-label con lo stesso numero progressivo */}
                        <button
                          type="button"
                          aria-label={`Rimuovi Difetto ${index + 1}`}
                          className="-mr-2 flex size-10 cursor-pointer items-center justify-center rounded-md text-xl leading-none text-slate-500 hover:bg-slate-100 hover:text-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                          onClick={() => handleCancellaDifetto(difetto.id)}
                        >
                          <span aria-hidden="true">×</span>
                        </button>
                      </div>

                      <fieldset className="mt-3">
                        <legend className="text-xs font-medium uppercase tracking-wide text-slate-500">
                          Severità
                        </legend>
                        {/* name dei tre radio: unico per ogni difetto (es. con l'id temporaneo) */}
                        <div className="mt-2 grid grid-cols-3 gap-2">
                          <label className="flex min-h-11 cursor-pointer items-center justify-center rounded-md border border-slate-300 bg-white text-sm font-medium text-slate-700 has-checked:border-slate-500 has-checked:bg-slate-100 has-checked:text-slate-900 has-checked:ring-1 has-checked:ring-slate-500 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-blue-600">
                            <input
                              type="radio"
                              name={difetto.id}
                              value="lieve"
                              checked={difetto.severita === "lieve"}
                              className="sr-only"
                              onChange={(e) =>
                                handleModificaDifetti(
                                  difetto.id,
                                  "severita",
                                  e.target.value,
                                )
                              }
                            />
                            Lieve
                          </label>
                          <label className="flex min-h-11 cursor-pointer items-center justify-center rounded-md border border-slate-300 bg-white text-sm font-medium text-slate-700 has-checked:border-amber-500 has-checked:bg-amber-50 has-checked:text-amber-900 has-checked:ring-1 has-checked:ring-amber-500 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-blue-600">
                            <input
                              type="radio"
                              name={difetto.id}
                              value="media"
                              checked={difetto.severita === "media"}
                              className="sr-only"
                              onChange={(e) =>
                                handleModificaDifetti(
                                  difetto.id,
                                  "severita",
                                  e.target.value,
                                )
                              }
                            />
                            Media
                          </label>
                          <label className="flex min-h-11 cursor-pointer items-center justify-center rounded-md border border-slate-300 bg-white text-sm font-medium text-slate-700 has-checked:border-red-600 has-checked:bg-red-50 has-checked:text-red-800 has-checked:ring-1 has-checked:ring-red-600 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-blue-600">
                            <input
                              type="radio"
                              name={difetto.id}
                              value="grave"
                              checked={difetto.severita === "grave"}
                              className="sr-only"
                              onChange={(e) =>
                                handleModificaDifetti(
                                  difetto.id,
                                  "severita",
                                  e.target.value,
                                )
                              }
                            />
                            Grave
                          </label>
                        </div>
                      </fieldset>

                      <div className="mt-3">
                        {/* htmlFor e id: unici per ogni difetto */}
                        <label
                          htmlFor={difetto.id}
                          className="text-xs font-medium uppercase tracking-wide text-slate-500"
                        >
                          Descrizione
                        </label>
                        <textarea
                          id={difetto.id}
                          rows="2"
                          value={difetto.descrizione}
                          placeholder="Es. cavo scoperto sul lato nord"
                          className="mt-2 block w-full rounded-md border border-slate-300 px-3 py-2 text-base text-slate-900 placeholder:text-slate-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                          onChange={(e) =>
                            handleModificaDifetti(
                              difetto.id,
                              "descrizione",
                              e.target.value,
                            )
                          }
                        />
                      </div>

                      <div className="mt-4">
                        <div className="flex items-baseline justify-between">
                          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                            Foto
                          </p>
                          {/* numero di foto di questo difetto + " di 3" */}
                          <span className="text-xs text-slate-500">
                            {difetto.foto.length} di 3
                          </span>
                        </div>

                        <ul className="mt-2 grid grid-cols-4 gap-2">
                          {difetto.foto.map((singolaFoto, posizione) => {
                            return (
                              <li key={singolaFoto.id} className="relative">
                                {/* src = anteprima della foto; alt con il numero della foto e del difetto */}
                                <img
                                  src={`${singolaFoto.anteprima}`}
                                  alt={`Foto ${posizione + 1} del difetto ${index + 1}`}
                                  className="aspect-square w-full rounded-md object-cover ring-1 ring-slate-200"
                                />
                                {/* onClick: toglie questa foto; aria-label con gli stessi numeri */}
                                <button
                                  type="button"
                                  aria-label={`Rimuovi foto ${posizione + 1} del difetto ${index + 1}`}
                                  className="absolute -right-1.5 -top-1.5 flex size-7 cursor-pointer items-center justify-center rounded-full bg-slate-900 text-sm leading-none text-white ring-2 ring-white hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                                  onClick={() => {
                                    handleCancellaFoto(difetto.id, singolaFoto);
                                  }}
                                >
                                  <span aria-hidden="true">×</span>
                                </button>
                              </li>
                            );
                          })}

                          {/* il <li> del bottone: solo se le foto sono meno di 3 */}
                          {difetto.foto.length < 3 && (
                            <li>
                              {/* htmlFor = id dell'input qui sotto, unico per difetto (es. "file-" + id del difetto) */}
                              <label
                                htmlFor={`file-${difetto.id}`}
                                className="flex aspect-square w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed border-slate-300 text-xs font-medium text-slate-600 hover:border-blue-400 hover:text-blue-700 has-disabled:cursor-not-allowed has-disabled:opacity-50 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-blue-600"
                              >
                                <span
                                  aria-hidden="true"
                                  className="text-xl leading-none"
                                >
                                  +
                                </span>
                                {/* durante la preparazione di questo difetto: "Preparazione…" */}
                                Foto
                                {/* id unico per difetto; disabled durante la preparazione; onChange: le foto scelte */}
                                <input
                                  id={`file-${difetto.id}`}
                                  type="file"
                                  accept="image/*"
                                  multiple
                                  className="sr-only"
                                  onChange={(e) =>
                                    handleAggiungiFoto(difetto.id, e)
                                  }
                                />
                              </label>
                            </li>
                          )}
                        </ul>

                        {/* solo se l'avviso riguarda questo difetto */}
                        {avvisoFoto === difetto.id && (
                          <p
                            role="status"
                            className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900"
                          >
                            Massimo 3 foto per difetto: le altre non sono state
                            aggiunte.
                          </p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            <button
              type="button"
              className="mt-4 flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 text-sm font-medium text-slate-700 hover:border-blue-400 hover:text-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              onClick={handleAggiungiDifetto}
            >
              <span aria-hidden="true" className="text-lg leading-none">
                +
              </span>
              Aggiungi difetto
            </button>
          </section>
        )}

        {/* ── NOTE ── */}
        <div>
          <label
            htmlFor="note"
            className="text-base font-semibold text-slate-900"
          >
            Note{" "}
            <span className="font-normal text-slate-500">(facoltative)</span>
          </label>
          <textarea
            id="note"
            rows="4"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Osservazioni che non sono difetti, ad esempio un accesso difficile."
            className="mt-2 block w-full rounded-lg border border-slate-300 px-3 py-2 text-base text-slate-900 placeholder:text-slate-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          />
        </div>

        {/* ── BARRA DI INVIO, fissa in fondo allo schermo ── */}
        <div className="fixed inset-x-0 bottom-0 border-t border-slate-200 bg-white/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur">
          <div className="mx-auto max-w-lg">
            {errore && (
              <p
                role="alert"
                className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
              >
                {errore}
              </p>
            )}

            {/* disabled: esito vuoto oppure invio in corso */}
            <button
              disabled={!esito || invioInCorso}
              type="submit"
              className="flex min-h-12 w-full cursor-pointer items-center justify-center rounded-lg bg-blue-600 px-4 text-base font-semibold text-white enabled:hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {invioInCorso ? "Invio in corso" : "Invia ispezione"}
            </button>
          </div>
        </div>
      </form>
    </main>
  );
}
