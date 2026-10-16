import { Navigate } from "react-router";

export default function Smistatore() {
  const ruolo = localStorage.getItem("ruolo");
  if (ruolo === "operatore" || ruolo === "admin") {
    return <Navigate to="/operatore" replace />;
  }
  if (ruolo === "supervisore") {
    return <Navigate to="/supervisore" replace />;
  }

  return <Navigate to="/login" replace />;
}
