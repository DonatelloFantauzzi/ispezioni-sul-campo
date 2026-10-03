import { createBrowserRouter, RouterProvider, Navigate } from "react-router";
import Operatore from "./pages/Operatore";
import Supervisore from "./pages/Supervisore";
import DettaglioIspezione from "./pages/DettaglioIspezione";

const router = createBrowserRouter([
  { path: "/", element: <Navigate to="/operatore" replace /> },
  { path: "/operatore", element: <Operatore /> },
  { path: "/supervisore", element: <Supervisore /> },
  { path: "supervisore/ispezioni/:id", element: <DettaglioIspezione /> },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
