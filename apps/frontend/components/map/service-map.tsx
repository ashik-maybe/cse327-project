"use client"

import L from "leaflet"
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import type { ServicePointRecord } from "@/lib/api"
import { categoryColor, categoryLabel, directionsUrl } from "./categories"

const CAMP_CENTER: [number, number] = [21.1952, 92.1523]

function markerIcon(color: string) {
  return L.divIcon({
    className: "",
    html: `<span style="display:block;width:18px;height:18px;border-radius:9999px;background:${color};border:2px solid #fff;box-shadow:0 0 0 1px rgba(0,0,0,0.3)"></span>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -10],
  })
}

export default function ServiceMap({ points }: { points: ServicePointRecord[] }) {
  return (
    <MapContainer
      center={CAMP_CENTER}
      zoom={14}
      scrollWheelZoom={false}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {points.map((point) => (
        <Marker
          key={point.id}
          position={[point.latitude, point.longitude]}
          icon={markerIcon(categoryColor(point.category))}
        >
          <Popup>
            <div className="space-y-1">
              <p className="font-semibold">{point.name}</p>
              <p>{categoryLabel(point.category)}</p>
              {point.area ? <p>{point.area}</p> : null}
              {point.openingHours ? <p>{point.openingHours}</p> : null}
              <a href={directionsUrl(point)} target="_blank" rel="noreferrer">
                Directions
              </a>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
