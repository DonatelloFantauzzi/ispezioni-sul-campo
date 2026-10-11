import { useState } from "react";
import { useNavigate } from "react-router";

const datiUtente = {
  password: "",
  email: "",
};

export default function Login() {
  const [credenziali, setCredenziali] = useState(datiUtente);
  const [errore, setErrore] = useState(null);
  const [caricamento, setCaricamento] = useState(false);

  const navigate = useNavigate();

  const setLocalStorage = (token, ruolo) => {
    localStorage.setItem("token", token);
    localStorage.setItem("ruolo", ruolo);
  };

  const getLogin = async () => {
    try {
      setCaricamento(true);
      setErrore(null);
      const risposta = await fetch(`http://localhost:3000/api/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credenziali),
      });
      const dati = await risposta.json();
      if (!risposta.ok) {
        throw new Error(dati.messaggio);
      }
      setLocalStorage(dati.token, dati.ruolo);
      if (dati.ruolo === "operatore") {
        navigate("/", { replace: true });
      } else if (dati.ruolo === "supervisore") {
        navigate("/supervisore", { replace: true });
      }
    } catch (error) {
      console.error(error);
      setErrore(error.message);
    } finally {
      setCaricamento(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-xl border border-slate-200 shadow-sm p-8">
        <h1 className="text-2xl font-semibold text-slate-800 text-center">
          Ispezioni sul campo
        </h1>
        <p className="mt-1 mb-6 text-sm text-slate-500 text-center">
          Accedi con le tue credenziali
        </p>

        <form
          className="flex flex-col gap-4"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            getLogin();
          }}
        >
          <div className="flex flex-col gap-1">
            <label
              htmlFor="email"
              className="text-sm font-medium text-slate-700"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={credenziali.email}
              autoComplete="email"
              required
              className="rounded-md border border-slate-300 px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              onChange={(e) =>
                setCredenziali({
                  ...credenziali,
                  [e.target.name]: e.target.value,
                })
              }
            />
          </div>

          <div className="flex flex-col gap-1">
            <label
              htmlFor="password"
              className="text-sm font-medium text-slate-700"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={credenziali.password}
              autoComplete="current-password"
              required
              className="rounded-md border border-slate-300 px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              onChange={(e) =>
                setCredenziali({
                  ...credenziali,
                  [e.target.name]: e.target.value,
                })
              }
            />
          </div>

          {errore && (
            <p role="alert" className="text-sm text-red-600">
              {errore}
            </p>
          )}

          <button
            type="submit"
            className="mt-2 rounded-md bg-sky-600 py-2 font-medium text-white hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={caricamento}
          >
            Accedi
          </button>
        </form>
      </div>
    </main>
  );
}
