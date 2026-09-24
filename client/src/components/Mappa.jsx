import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

export default function Mappa({ assets }) {
  return (
    <div className="h-[calc(100vh-6rem)] w-full">
      <MapContainer center={[41.9, 12.5]} zoom={12} className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {assets.map((asset) => {
          return (
            <Marker key={asset.id} position={[asset.lat, asset.lng]}>
              <Popup>
                <p>{asset.nome}</p>
                <p>{asset.indirizzo}</p>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
