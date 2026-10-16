import { Navigate, Outlet } from "react-router";

export default function RottaProtetta({ ruoli }) {
  const token = localStorage.getItem("token");
  const ruolo = localStorage.getItem("ruolo");
  if (!token || !ruolo) {
    return <Navigate to="/login" replace />;
  }

  if (ruoli && !ruoli.includes(ruolo)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
