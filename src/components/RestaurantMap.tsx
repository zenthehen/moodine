"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix Leaflet's default icon path issues with webpack
const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface RestaurantMapProps {
  name: string;
  address: string;
  // Fallback coordinates for Kathmandu
  lat?: number;
  lng?: number;
}

export default function RestaurantMap({ name, address, lat = 27.7172, lng = 85.3240 }: RestaurantMapProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <div className="h-64 bg-rust/5 rounded-2xl animate-pulse" />;
  }

  return (
    <div className="h-64 w-full rounded-2xl overflow-hidden border border-rust/10 relative z-0">
      <MapContainer center={[lat, lng]} zoom={14} scrollWheelZoom={false} className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[lat, lng]} icon={icon}>
          <Popup>
            <strong>{name}</strong><br />
            {address}
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
