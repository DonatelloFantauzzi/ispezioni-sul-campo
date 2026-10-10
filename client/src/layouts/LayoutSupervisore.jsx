import { NavLink, Outlet } from "react-router";

export default function LayoutSupervisore() {
  return (
    <main className="mx-auto max-w-6xl p-8">
      <h1 className="text-3xl font-bold text-blue-600">
        Dashboard supervisore
      </h1>

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
