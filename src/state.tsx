import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { properties } from "./data";
import {
  compareAllowed,
  labels,
  rates,
  type Currency,
  type Lang,
  type Property,
} from "./model";
import {
  readLocal,
  writeLocal,
  loadListings,
  saveListing,
  deleteListing,
} from "./storage";
type Settings = {
  theme: "dark" | "light";
  lang: Lang;
  currency: Currency;
  reduce: boolean;
};
type Session = { name: string; email: string } | null;
const defaultSettings: Settings = {
  theme: matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light",
  lang: navigator.language.startsWith("ru") ? "ru" : "en",
  currency: "USD",
  reduce: false,
};
function usePersist<T>(key: string, init: T, valid: (v: unknown) => boolean) {
  const [value, setValue] = useState<T>(() => readLocal(key, init, valid));
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    setFailed(!writeLocal(key, value));
  }, [key, value]);
  return [value, setValue, failed] as const;
}
const strings = (v: unknown) =>
  Array.isArray(v) && v.every((x) => typeof x === "string");
const Context = createContext<ReturnType<typeof useStore> | null>(null);
function useStore() {
  const [settings, setSettings, settingsFailed] = usePersist<Settings>(
    "settings",
    defaultSettings,
    (v) =>
      !!v &&
      ["dark", "light"].includes((v as Settings).theme) &&
      ["en", "ru"].includes((v as Settings).lang) &&
      ["USD", "EUR", "AED"].includes((v as Settings).currency) &&
      typeof (v as Settings).reduce === "boolean",
  );
  const [favorites, setFavorites, favFailed] = usePersist<string[]>(
    "favorites",
    [],
    strings,
  );
  const [compare, setCompare] = usePersist<string[]>(
    "compare",
    [],
    (v) => strings(v) && (v as string[]).length <= 2,
  );
  const [session, setSession] = usePersist<Session>(
    "session",
    null,
    (v) =>
      !!v &&
      typeof (v as { name: string }).name === "string" &&
      typeof (v as { email: string }).email === "string",
  );
  const [notice, setNotice] = usePersist<boolean>(
    "notice",
    false,
    (v) => typeof v === "boolean",
  );
  const [own, setOwn] = useState<Property[]>([]),
    [storageError, setStorageError] = useState(false),
    [loaded, setLoaded] = useState(false);
  const [toast, setToast] = useState(""),
    [loginOpen, setLoginOpen] = useState(false),
    [compareOpen, setCompareOpen] = useState(false),
    [pendingCompare, setPendingCompare] = useState<Property | null>(null);
  const [systemReduce, setSystemReduce] = useState(
    matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const t = (en: string, ru: string) => (settings.lang === "ru" ? ru : en);
  const label = (key: string) => (labels[key] ? t(...labels[key]) : key);
  const all = useMemo(() => [...properties, ...own], [own]);
  useEffect(() => {
    if (!loaded || storageError) return;
    const ids = new Set(all.map((p) => p.id));
    const cleanFavorites = [...new Set(favorites)].filter((id) => ids.has(id));
    const candidates = [...new Set(compare)].filter((id) => ids.has(id));
    const deal = all.find((p) => p.id === candidates[0])?.deal;
    const cleanCompare = candidates
      .filter((id) => all.find((p) => p.id === id)?.deal === deal)
      .slice(0, 2);
    if (JSON.stringify(cleanFavorites) !== JSON.stringify(favorites))
      setFavorites(cleanFavorites);
    if (JSON.stringify(cleanCompare) !== JSON.stringify(compare))
      setCompare(cleanCompare);
  }, [loaded, storageError, all, favorites, compare]);
  useEffect(() => {
    loadListings()
      .then(setOwn)
      .catch(() => setStorageError(true))
      .finally(() => setLoaded(true));
    const mq = matchMedia("(prefers-reduced-motion: reduce)");
    const fn = () => setSystemReduce(mq.matches);
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = settings.theme;
    document.documentElement.lang = settings.lang;
    document.documentElement.dataset.motion =
      settings.reduce || systemReduce ? "reduced" : "full";
  }, [settings, systemReduce]);
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(""), 5000);
    return () => clearTimeout(id);
  }, [toast]);
  const notify = (text: string) => setToast(text);
  const toggleFavorite = (id: string) =>
    setFavorites((a) =>
      a.includes(id) ? a.filter((x) => x !== id) : [...a, id],
    );
  const toggleCompare = (p: Property) => {
    const selected = all.filter((x) => compare.includes(x.id)),
      result = compareAllowed(selected, p);
    if (result === "remove") setCompare((a) => a.filter((x) => x !== p.id));
    else if (result === "deal")
      notify(
        t(
          "Compare homes with the same transaction type.",
          "Сравнивайте объекты одного типа сделки.",
        ),
      );
    else if (result === "full") {
      setPendingCompare(p);
      setCompareOpen(true);
    } else {
      setCompare((a) => [...a, p.id]);
      notify(t("Added to comparison.", "Добавлено к сравнению."));
    }
  };
  const money = (usd: number, compact = false) =>
    new Intl.NumberFormat(settings.lang === "ru" ? "ru-RU" : "en-US", {
      style: "currency",
      currency: settings.currency,
      maximumFractionDigits: compact ? 1 : 0,
      notation: compact ? "compact" : "standard",
    }).format(usd * rates[settings.currency]);
  const price = (p: Property, compact = false) =>
    money(p.price, compact) +
    (p.deal === "rent"
      ? t(
          p.period === "week" ? " / week" : " / month",
          p.period === "week" ? " / нед." : " / мес.",
        )
      : "");
  async function upsert(p: Property) {
    await saveListing(p);
    setOwn((a) => [...a.filter((x) => x.id !== p.id), p]);
  }
  async function remove(id: string) {
    await deleteListing(id);
    setOwn((a) => a.filter((x) => x.id !== id));
    setFavorites((a) => a.filter((x) => x !== id));
    setCompare((a) => a.filter((x) => x !== id));
  }
  return {
    settings,
    setSettings,
    t,
    label,
    money,
    price,
    favorites,
    toggleFavorite,
    compare,
    setCompare,
    toggleCompare,
    session,
    setSession,
    notice,
    setNotice,
    all,
    own,
    loaded,
    storageError: storageError || settingsFailed || favFailed,
    toast,
    notify,
    loginOpen,
    setLoginOpen,
    compareOpen,
    setCompareOpen,
    pendingCompare,
    setPendingCompare,
    upsert,
    remove,
    reduced: settings.reduce || systemReduce,
  };
}
export function Provider({ children }: { children: ReactNode }) {
  const store = useStore();
  return <Context.Provider value={store}>{children}</Context.Provider>;
}
export function useApp() {
  return useContext(Context)!;
}
