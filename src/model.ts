export type Lang = "en" | "ru";
export type Deal = "buy" | "rent";
export type City = "Dubai" | "Monaco" | "New York" | "Tokyo" | "Miami";
export type Kind = "villa" | "apartment" | "mansion" | "waterfront";
export type Photo = { src: string; frame?: number };
export type Property = {
  id: string;
  slug: string;
  name: string;
  city: City;
  country: { en: string; ru: string };
  district: string;
  lat: number;
  lng: number;
  type: Kind;
  deal: Deal;
  price: number;
  period?: "week" | "month";
  area: number;
  beds: number;
  baths: number;
  description: { en: string; ru: string };
  amenities: string[];
  features: { en: string; ru: string };
  photos: Photo[];
  added: string;
  popularity: number;
  user?: boolean;
};
export type Filters = {
  q: string;
  city: string;
  deal: string;
  type: string;
  minPrice: string;
  maxPrice: string;
  minArea: string;
  maxArea: string;
  beds: string;
  baths: string;
  amenities: string[];
};
export const emptyFilters: Filters = {
  q: "",
  city: "",
  deal: "buy",
  type: "",
  minPrice: "",
  maxPrice: "",
  minArea: "",
  maxArea: "",
  beds: "",
  baths: "",
  amenities: [],
};
export const rates = { USD: 1, EUR: 0.92, AED: 3.6725 };
export type Currency = keyof typeof rates;
export const cities: {
  name: City;
  ru: string;
  lat: number;
  lng: number;
  country: { en: string; ru: string };
  district: string;
}[] = [
  {
    name: "Dubai",
    ru: "Дубай",
    lat: 25.117,
    lng: 55.137,
    country: { en: "United Arab Emirates", ru: "ОАЭ" },
    district: "Palm Jumeirah",
  },
  {
    name: "Monaco",
    ru: "Монако",
    lat: 43.7384,
    lng: 7.4246,
    country: { en: "Monaco", ru: "Монако" },
    district: "Monte Carlo",
  },
  {
    name: "New York",
    ru: "Нью-Йорк",
    lat: 40.761,
    lng: -73.975,
    country: { en: "United States", ru: "США" },
    district: "Manhattan",
  },
  {
    name: "Tokyo",
    ru: "Токио",
    lat: 35.659,
    lng: 139.729,
    country: { en: "Japan", ru: "Япония" },
    district: "Minato",
  },
  {
    name: "Miami",
    ru: "Майами",
    lat: 25.79,
    lng: -80.13,
    country: { en: "United States", ru: "США" },
    district: "Miami Beach",
  },
];
export const kinds: Kind[] = ["villa", "apartment", "mansion", "waterfront"];
export const amenities = [
  "pool",
  "terrace",
  "gym",
  "parking",
  "concierge",
  "garden",
  "cinema",
  "spa",
];
export const labels: Record<string, [string, string]> = {
  villa: ["Villa", "Вилла"],
  apartment: ["Luxury apartment", "Элитные апартаменты"],
  mansion: ["Mansion", "Особняк"],
  waterfront: ["Waterfront residence", "Резиденция у моря"],
  pool: ["Private pool", "Частный бассейн"],
  terrace: ["Terrace", "Терраса"],
  gym: ["Gym", "Спортзал"],
  parking: ["Parking", "Паркинг"],
  concierge: ["Concierge", "Консьерж"],
  garden: ["Garden", "Сад"],
  cinema: ["Cinema", "Кинотеатр"],
  spa: ["Spa", "Спа"],
  buy: ["For sale", "Покупка"],
  rent: ["For rent", "Аренда"],
};
export function monthlyPayment(
  price: number,
  deposit: number,
  years: number,
  rate: number,
) {
  if (
    ![price, deposit, years, rate].every(Number.isFinite) ||
    price <= 0 ||
    deposit < 0 ||
    deposit > price ||
    years < 1 ||
    years > 50 ||
    rate < 0 ||
    rate > 30
  )
    return null;
  const p = price - deposit,
    n = years * 12,
    r = rate / 1200;
  return r === 0 ? p / n : (p * r) / (1 - Math.pow(1 + r, -n));
}
export function filterProperties(
  items: Property[],
  f: Filters,
  currency: Currency = "USD",
) {
  const q = f.q.trim().toLowerCase();
  return items.filter(
    (p) =>
      (!f.deal || p.deal === f.deal) &&
      (!f.city || p.city === f.city) &&
      (!f.type || p.type === f.type) &&
      (!q ||
        [
          p.name,
          p.city,
          cities.find((c) => c.name === p.city)?.ru,
          p.district,
          p.description.en,
          p.description.ru,
        ]
          .join(" ")
          .toLowerCase()
          .includes(q)) &&
      (!f.minPrice || p.price * rates[currency] >= Number(f.minPrice)) &&
      (!f.maxPrice || p.price * rates[currency] <= Number(f.maxPrice)) &&
      (!f.minArea || p.area >= Number(f.minArea)) &&
      (!f.maxArea || p.area <= Number(f.maxArea)) &&
      (!f.beds || p.beds >= Number(f.beds)) &&
      (!f.baths || p.baths >= Number(f.baths)) &&
      f.amenities.every((a) => p.amenities.includes(a)),
  );
}
export function sortProperties(items: Property[], sort: string) {
  return [...items].sort((a, b) =>
    sort === "price-asc"
      ? a.price - b.price
      : sort === "price-desc"
        ? b.price - a.price
        : sort === "area-asc"
          ? a.area - b.area
          : sort === "area-desc"
            ? b.area - a.area
            : sort === "newest"
              ? b.added.localeCompare(a.added)
              : b.popularity - a.popularity,
  );
}
export function parseFilters(params: URLSearchParams): Filters {
  const f = { ...emptyFilters };
  for (const k of Object.keys(f) as (keyof Filters)[]) {
    if (k === "amenities")
      f.amenities = (params.get(k) || "")
        .split(",")
        .filter((a) => amenities.includes(a));
    else f[k] = params.get(k) ?? f[k];
  }
  return f;
}
export function filterParams(f: Filters) {
  const p = new URLSearchParams();
  Object.entries(f).forEach(([k, v]) => {
    if (Array.isArray(v) ? v.length : v)
      p.set(k, Array.isArray(v) ? v.join(",") : v);
  });
  return p;
}
export function compareAllowed(current: Property[], p: Property) {
  return current.some((x) => x.id === p.id)
    ? "remove"
    : current.some((x) => x.deal !== p.deal)
      ? "deal"
      : current.length >= 2
        ? "full"
        : "add";
}
