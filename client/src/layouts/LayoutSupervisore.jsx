import { Link, NavLink, useNavigate, Outlet } from "react-router";

export default function LayoutSupervisore() {
  const ruolo = localStorage.getItem("ruolo");
  const navigate = useNavigate();

  const onLogout = () => {
    localStorage.removeItem("ruolo");
    localStorage.removeItem("token");
    navigate("/", { replace: true });
  };
  return (
    <main className="mx-auto max-w-6xl p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold text-blue-600">
          Dashboard supervisore
        </h1>

        <div className="flex items-center gap-3">
          {ruolo === "admin" && (
            <Link
              to="/operatore"
              className="inline-flex min-h-11 items-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:border-blue-400 hover:text-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              <span aria-hidden="true">←</span>
              Mappa operatore
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
      </div>

      <nav
        aria-label="Sezioni della dashboard"
        className="mt-6 border-b border-slate-200"
      >
        <ul className="-mb-px flex gap-2">
          <li>
            {/* scheda INATTIVA */}
            <NavLink
              to={"/supervisore/da-gestire"}
              className={({ isActive }) =>
                `block border-b-2 px-4 py-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${isActive ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700"}`
              }
            >
              Da gestire
            </NavLink>
          </li>
          <li>
            {/* scheda ATTIVA */}
            <NavLink
              end
              to={"/supervisore"}
              className={({ isActive }) =>
                `block border-b-2 px-4 py-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${isActive ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700"}`
              }
            >
              Registro ispezioni
            </NavLink>
          </li>
        </ul>
      </nav>

      <Outlet />
    </main>
  );
}
