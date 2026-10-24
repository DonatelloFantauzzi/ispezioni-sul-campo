import { createBrowserRouter, RouterProvider } from "react-router";
import Operatore from "./pages/Operatore";
import SupervisoreRegistro from "./pages/SupervisoreRegistro";
import SupervisoreDaGestire from "./pages/SupervisoreDaGestire";
import DettaglioIspezione from "./pages/DettaglioIspezione";
import LayoutSupervisore from "./layouts/LayoutSupervisore";
import Login from "./pages/Login";
import RottaProtetta from "./components/RottaProtetta";
import Smistatore from "./components/Smistatore";
import NuovaIspezione from "./pages/NuovaIspezione";

const router = createBrowserRouter([
  { path: "/login", element: <Login /> },
  {
    element: <RottaProtetta />,
    children: [
      { path: "/", element: <Smistatore /> },
      {
        element: <RottaProtetta ruoli={["operatore", "admin"]} />,
        children: [
          { path: "/operatore", element: <Operatore /> },
          {
            path: "/operatore/asset/:id/ispezione",
            element: <NuovaIspezione />,
          },
        ],
      },
      {
        element: <RottaProtetta ruoli={["supervisore", "admin"]} />,
        children: [
          {
            path: "/supervisore",
            element: <LayoutSupervisore />,
            children: [
              { index: true, element: <SupervisoreRegistro /> },
              { path: "da-gestire", element: <SupervisoreDaGestire /> },
            ],
          },
          {
            path: "/supervisore/ispezioni/:id",
            element: <DettaglioIspezione />,
          },
        ],
      },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
