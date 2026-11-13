import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Link } from "react-router-dom";
import { ArrowUpRight, X } from "lucide-react";
import { useApp } from "./state";
import { cities, type Property } from "./model";
import { PhotoView } from "./components";
export default function PropertyMap({
  items,
  active,
  onSelect,
  cityMode = false,
}: {
  items: Property[];
  active?: string;
  onSelect?: (id: string) => void;
  cityMode?: boolean;
}) {
  const s = useApp(),
    host = useRef<HTMLDivElement>(null),
    map = useRef<L.Map | null>(null),
    layer = useRef<L.LayerGroup | null>(null),
    [selected, setSelected] = useState<string | null>(null),
    [failed, setFailed] = useState(false);
  const property = items.find((p) => p.id === (active || selected));
  useEffect(() => {
    if (!host.current) return;
    const m = L.map(host.current, {
      scrollWheelZoom: false,
      minZoom: 2,
      maxZoom: 18,
      worldCopyJump: true,
    }).setView([30, 10], 2);
    map.current = m;
    const tiles = L.tileLayer(
      "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      },
    ).addTo(m);
    tiles.on("tileerror", () => setFailed(true));
    tiles.on("tileload", () => setFailed(false));
    layer.current = L.layerGroup().addTo(m);
    const observer = new ResizeObserver(() => m.invalidateSize());
    observer.observe(host.current);
    return () => {
      observer.disconnect();
      m.remove();
      map.current = null;
    };
  }, []);
  useEffect(() => {
    const m = map.current,
      group = layer.current;
    if (!m || !group) return;
    const valid = items.filter(
      (p) => Number.isFinite(p.lat) && Number.isFinite(p.lng),
    );
    const draw = () => {
      group.clearLayers();
      const occupied: L.Point[] = [];
      valid.forEach((p) => {
        const origin = m.latLngToContainerPoint([p.lat, p.lng]);
        const size = m.getSize();
        if (
          origin.x < 0 ||
          origin.y < 0 ||
          origin.x > size.x ||
          origin.y > size.y
        )
          return;
        let displayed = origin.clone();
        for (let n = 0; n < 30; n++) {
          const row = Math.ceil(n / 2) * (n % 2 ? 1 : -1);
          displayed = L.point(
            Math.max(52, Math.min(size.x - 52, origin.x)),
            Math.max(42, Math.min(size.y - 40, origin.y + row * 42)),
          );
          if (
            !occupied.some(
              (a) =>
                Math.abs(a.x - displayed.x) < 100 &&
                Math.abs(a.y - displayed.y) < 39,
            )
          )
            break;
        }
        occupied.push(displayed);
        const position = m.containerPointToLatLng(displayed);
        if (origin.distanceTo(displayed) > 3) {
          L.polyline([[p.lat, p.lng], position], {
            color: "#90949c",
            weight: 1,
            opacity: 0.65,
            interactive: false,
          }).addTo(group);
          L.circleMarker([p.lat, p.lng], {
            radius: 2,
            color: "#90949c",
            fillOpacity: 1,
            interactive: false,
          }).addTo(group);
        }
        const marker = L.marker(position, {
          icon: L.divIcon({
            className: `price-pin ${p.id === (active || selected) ? "active" : ""}`,
            html: `<span>${cityMode ? (s.settings.lang === "ru" ? cities.find((c) => c.name === p.city)?.ru : p.city) : s.money(p.price, true)}</span>`,
            iconSize: [90, 32],
            iconAnchor: [45, 16],
          }),
          title: cityMode ? p.city : p.name,
          keyboard: true,
        }).addTo(group);
        marker.on("click", () => {
          setSelected(p.id);
          onSelect?.(p.id);
        });
      });
    };
    if (valid.length)
      m.fitBounds(
        L.latLngBounds(valid.map((p) => [p.lat, p.lng] as [number, number])),
        { padding: [65, 65], maxZoom: 12, animate: false },
      );
    draw();
    m.on("moveend zoomend resize", draw);
    return () => {
      m.off("moveend zoomend resize", draw);
    };
  }, [items, s.settings.currency, s.settings.lang]);
  useEffect(() => {
    const p = items.find((x) => x.id === active);
    if (p && map.current) {
      setSelected(p.id);
      map.current.flyTo(
        [p.lat, p.lng],
        cityMode ? 3 : Math.max(map.current.getZoom(), 11),
        { animate: !s.reduced, duration: 0.8 },
      );
    }
  }, [active]);
  return (
    <div className="map-shell">
      <div
        ref={host}
        className="map"
        aria-label={s.t("Property map", "Карта объектов")}
      />
      <div className="map-status">
        {s.t("DEMO LOCATIONS", "ДЕМО ЛОКАЦИИ")}
        <span>
          {items.length} {s.t("properties", "объектов")}
        </span>
      </div>
      {failed && (
        <div className="map-error" role="status">
          {s.t(
            "Map tiles unavailable. Property markers and the list remain accessible.",
            "Карта недоступна. Маркеры и список объектов продолжают работать.",
          )}
        </div>
      )}
      {property && (
        <div className="map-popup">
          <PhotoView photo={property.photos[0]} alt={property.name} />
          <div>
            <strong>
              {cityMode
                ? s.settings.lang === "ru"
                  ? cities.find((c) => c.name === property.city)?.ru
                  : property.city
                : property.name}
            </strong>
            <p>
              {cityMode
                ? `${s.all.filter((p) => p.city === property.city).length} ${s.t("properties", "объектов")}`
                : s.price(property)}
            </p>
            <Link
              to={
                cityMode
                  ? `/properties?deal=&city=${encodeURIComponent(property.city)}`
                  : `/properties/${property.slug}`
              }
            >
              {s.t("Explore home", "Смотреть объект")}
              <ArrowUpRight size={15} />
            </Link>
          </div>
          <button
            className="icon-button"
            aria-label={s.t("Close map card", "Закрыть карточку на карте")}
            onClick={() => {
              setSelected(null);
              onSelect?.("");
            }}
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
