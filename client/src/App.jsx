import { createBrowserRouter, RouterProvider, Navigate } from "react-router";
import Operatore from "./pages/Operatore";
import SupervisoreRegistro from "./pages/SupervisoreRegistro";
import SupervisoreDaGestire from "./pages/SupervisoreDaGestire";
import DettaglioIspezione from "./pages/DettaglioIspezione";
import LayoutSupervisore from "./layouts/LayoutSupervisore";

const router = createBrowserRouter([
  { path: "/", element: <Navigate to="/operatore" replace /> },
  { path: "/operatore", element: <Operatore /> },
  {
    path: "/supervisore",
    element: <LayoutSupervisore />,
    children: [
      { index: true, element: <SupervisoreRegistro /> },
      { path: "da-gestire", element: <SupervisoreDaGestire /> },
    ],
  },
  { path: "supervisore/ispezioni/:id", element: <DettaglioIspezione /> },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
