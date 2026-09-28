import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { useEffect } from "react";
import "leaflet/dist/leaflet.css";

const CentraMappa = ({ coordinate }) => {
  const mappa = useMap();
  useEffect(() => {
    if (!coordinate) return;
    const lat = coordinate.lat;
    const lng = coordinate.lng;
    mappa.setView([lat, lng], 13);
  }, [coordinate, mappa]);

  return null;
};

export default function Mappa({ assets, caricamento, coordinate }) {
  return (
    <div className="relative h-[calc(100vh-6rem)] w-full">
      <MapContainer center={[41.9, 12.5]} zoom={12} className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <CentraMappa coordinate={coordinate} />
        {assets.map((asset) => {
          return (
            <Marker key={asset.id} position={[asset.lat, asset.lng]}>
              <Popup>
                <div className="min-w-44 space-y-1">
                  <span className="inline-block rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                    {asset.tipologia}
                  </span>
                  <div className="text-sm font-semibold text-slate-900">
                    {asset.nome}
                  </div>
                  <div className="text-xs text-slate-500">
                    {asset.indirizzo}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
      {caricamento && (
        <div
          role="status"
          aria-live="polite"
          className="absolute inset-0 z-[1000] flex items-center justify-center bg-white/60 backdrop-blur-[1px]"
        >
          <span className="animate-pulse rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow">
            Caricamento asset…
          </span>
        </div>
      )}
    </div>
  );
}
