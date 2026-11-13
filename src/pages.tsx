import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  ArrowDown,
  SlidersHorizontal,
  Map as MapIcon,
  List,
  Heart,
  Scale,
  Maximize2,
  BedDouble,
  Bath,
  Check,
  Globe2,
  MoveUpRight,
  Play,
  Pause,
} from "lucide-react";
import { useApp } from "./state";
import { publicAsset } from "./paths";
import {
  cities,
  kinds,
  amenities,
  emptyFilters,
  parseFilters,
  filterParams,
  filterProperties,
  sortProperties,
  monthlyPayment,
  rates,
  type City,
  type Filters,
} from "./model";
import {
  Button,
  ContactForm,
  Empty,
  Gallery,
  Modal,
  PhotoView,
  PropertyCard,
  Share,
} from "./components";
const Globe = lazy(() => import("./Globe"));
const PropertyMap = lazy(() => import("./Map"));
export const MapView = PropertyMap;
export function MapLoading() {
  const s = useApp();
  return (
    <div className="map-loading" role="status">
      {s.t("Opening the map…", "Загружаем карту…")}
    </div>
  );
}
export function Home() {
  const s = useApp(),
    navigate = useNavigate(),
    [city, setCity] = useState<City | null>(null),
    [mapCity, setMapCity] = useState<City>("Dubai"),
    [deal, setDeal] = useState("buy"),
    [type, setType] = useState(""),
    [location, setLocation] = useState(""),
    [fallback, setFallback] = useState(false),
    [paused, setPaused] = useState(false);
  const [desktop, setDesktop] = useState(false);
  useEffect(() => {
    const mq = matchMedia("(min-width: 900px)");
    const update = () =>
      setDesktop(mq.matches && navigator.hardwareConcurrency > 2);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  const chosen = city && cities.find((c) => c.name === city);
  const cityItems = useMemo(
    () => s.all.filter((p) => p.city === mapCity),
    [s.all, mapCity],
  );
  return (
    <>
      <section className="hero">
        <div className="hero-orbit">
          <div className="globe-fallback">
            <img
              src={publicAsset("media/globe-fallback.webp")}
              alt={s.t("Earth from space", "Земля из космоса")}
            />
          </div>
          {desktop && !fallback && (
            <Suspense fallback={null}>
              <Globe
                selected={city}
                onSelect={setCity}
                reduced={s.reduced || paused}
                onFailure={() => setFallback(true)}
              />
            </Suspense>
          )}
          {desktop && fallback && (
            <video
              className="globe-video"
              autoPlay={!s.reduced}
              muted
              loop
              playsInline
              poster={publicAsset("media/globe-fallback.webp")}
            >
              <source src={publicAsset("media/globe-fallback.webm")} type="video/webm" />
            </video>
          )}
        </div>
        <div className="hero-topline">
          <span>
            <i className="status-dot" />
            {s.t(
              "EXCEPTIONAL HOMES. WITHOUT BORDERS.",
              "ИСКЛЮЧИТЕЛЬНЫЕ ДОМА. БЕЗ ГРАНИЦ.",
            )}
          </span>
          <span>{s.t("EST. CONCEPT / 2026", "КОНЦЕПТ / 2026")}</span>
        </div>
        <div className="hero-copy">
          <h1>
            {s.t("THE WORLD IS", "ВАШ ДОМ —")}
            <br />
            <span>{s.t("YOUR HOME", "ЦЕЛЫЙ МИР")}</span>
          </h1>
          <div className="hero-bottom-copy">
            <p>
              {s.t(
                "Extraordinary places. A different perspective.\nDiscover a home beyond the expected.",
                "Исключительные места. Новый взгляд.\nОткройте дом за пределами привычного.",
              )}
            </p>
            <a
              className="round-link"
              href="#destinations"
              aria-label={s.t("Discover destinations", "Выбрать город")}
            >
              <ArrowDown size={24} />
            </a>
          </div>
        </div>
        <div className="hero-city-controls">
          {cities.map((c) => (
            <button
              key={c.name}
              className={city === c.name ? "active" : ""}
              onClick={() => setCity(city === c.name ? null : c.name)}
            >
              {s.settings.lang === "ru" ? c.ru : c.name}
              <span />
            </button>
          ))}
          {desktop && (
            <button
              className="rotation-toggle"
              aria-label={s.t(
                "Pause or resume globe",
                "Остановить или запустить глобус",
              )}
              onClick={() => setPaused(!paused)}
            >
              {paused || s.reduced ? <Play size={13} /> : <Pause size={13} />}
            </button>
          )}
        </div>
        {chosen && (
          <div className="city-float">
            <strong>
              {s.settings.lang === "ru" ? chosen.ru : chosen.name}
            </strong>
            <span>
              {s.all.filter((p) => p.city === chosen.name).length}{" "}
              {s.t("exceptional properties", "объектов недвижимости")}
            </span>
            <Link
              to={`/properties?deal=&city=${encodeURIComponent(chosen.name)}`}
            >
              {s.t("Explore destination", "Смотреть предложения")}
              <ArrowUpRight size={14} />
            </Link>
          </div>
        )}
        <form
          className="hero-search"
          onSubmit={(e) => {
            e.preventDefault();
            navigate(
              `/properties?${filterParams({ ...emptyFilters, city: location, deal, type })}`,
            );
          }}
        >
          <label>
            {s.t("DESTINATION", "НАПРАВЛЕНИЕ")}
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            >
              <option value="">
                {s.t("Anywhere in the world", "В любой точке мира")}
              </option>
              {cities.map((c) => (
                <option key={c.name} value={c.name}>
                  {s.settings.lang === "ru" ? c.ru : c.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            {s.t("I AM LOOKING TO", "ТИП СДЕЛКИ")}
            <select value={deal} onChange={(e) => setDeal(e.target.value)}>
              <option value="buy">
                {s.t("Buy a property", "Купить недвижимость")}
              </option>
              <option value="rent">
                {s.t("Rent a property", "Арендовать недвижимость")}
              </option>
            </select>
          </label>
          <label>
            {s.t("PROPERTY TYPE", "ТИП НЕДВИЖИМОСТИ")}
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="">
                {s.t("All extraordinary homes", "Все типы недвижимости")}
              </option>
              {kinds.map((k) => (
                <option key={k} value={k}>
                  {s.label(k)}
                </option>
              ))}
            </select>
          </label>
          <Button type="submit">
            {s.t("Explore homes", "Найти дом")}
            <ArrowUpRight size={19} />
          </Button>
        </form>
        <div className="hero-foot">
          <span>
            {s.t("CURATED PERSPECTIVES, WORLDWIDE", "ОСОБЫЙ ВЗГЛЯД НА МИР")}
          </span>
          <span>25.1170° N · 55.1370° E</span>
          <span>
            {s.t("SCROLL TO DISCOVER", "ЛИСТАЙТЕ И ОТКРЫВАЙТЕ")}
            <ArrowDown size={12} />
          </span>
        </div>
      </section>
      <section id="destinations" className="section destinations">
        <div className="section-heading">
          <h2>
            {s.t("A world of possibilities.", "Мир возможностей.")}
            <br />
            <span>{s.t("Five places to belong.", "Пять мест для жизни.")}</span>
          </h2>
          <p>
            {s.t(
              "From the energy of a skyline to the quiet of the coast. Find the place that feels like you.",
              "От энергии мегаполиса до тишины побережья. Найдите место, которое отражает вас.",
            )}
          </p>
        </div>
        <div className="city-tabs">
          {cities.map((c) => (
            <button
              className={mapCity === c.name ? "active" : ""}
              key={c.name}
              onClick={() => setMapCity(c.name)}
            >
              {s.settings.lang === "ru" ? c.ru : c.name}
              <span>
                {s.all
                  .filter((p) => p.city === c.name)
                  .length.toString()
                  .padStart(2, "0")}
              </span>
            </button>
          ))}
        </div>
        <div className="destination-grid">
          <div className="destination-photo">
            <PhotoView
              photo={
                mapCity === "Dubai"
                  ? { src: "/media/dubai-skyline.jpg" }
                  : cityItems[0].photos[0]
              }
              alt={mapCity}
            />
            <div>
              <h3>
                {s.settings.lang === "ru"
                  ? cities.find((c) => c.name === mapCity)?.ru
                  : mapCity}
              </h3>
              <Link
                className="button"
                to={`/properties?deal=&city=${encodeURIComponent(mapCity)}`}
              >
                {s.t("Discover properties", "Смотреть объекты")}
                <ArrowUpRight size={17} />
              </Link>
            </div>
          </div>
          <Suspense fallback={<MapLoading />}>
            <PropertyMap
              cityMode
              items={cities.map((c) => s.all.find((p) => p.city === c.name)!)}
              onSelect={(id) => {
                const p = s.all.find((p) => p.id === id);
                if (p) setMapCity(p.city);
              }}
            />
          </Suspense>
        </div>
      </section>
      <section className="section">
        <div className="section-heading">
          <h2>{s.t("Homes that move you.", "Дома, которые вдохновляют.")}</h2>
          <Link className="text-link" to="/properties?deal=buy">
            {s.t("View the collection", "Вся коллекция")}
            <ArrowUpRight size={19} />
          </Link>
        </div>
        <div className="property-grid">
          {[s.all[0], s.all[4], s.all[7]].map((p) => (
            <PropertyCard p={p} key={p.id} />
          ))}
        </div>
      </section>
      <section className="manifesto section">
        <div className="manifesto-image">
          <PhotoView
            photo={s.all[11].photos[0]}
            alt={s.t(
              "A waterfront architectural concept",
              "Архитектурная концепция резиденции у воды",
            )}
          />
        </div>
        <div className="manifesto-copy">
          <h2>
            {s.t(
              "A new perspective\non finding home.",
              "Новый взгляд\nна поиск дома.",
            )}
          </h2>
          <p>
            {s.t(
              "Explore without borders. Look closer. Make space for the life you imagine.",
              "Исследуйте без границ. Смотрите глубже. Откройте пространство для жизни, которую представляете.",
            )}
          </p>
          {[
            [
              s.t("One world. One search.", "Один мир. Один поиск."),
              s.t(
                "Five international destinations in one considered collection.",
                "Пять международных направлений в одной коллекции.",
              ),
            ],
            [
              s.t("Every detail, in focus.", "Каждая деталь — в фокусе."),
              s.t(
                "Architecture, interiors and location, brought together.",
                "Архитектура, интерьеры и локация в одном месте.",
              ),
            ],
            [
              s.t("Your shortlist, your way.", "Ваша подборка. Ваш выбор."),
              s.t(
                "Save, compare and explore at your own pace.",
                "Сохраняйте, сравнивайте и исследуйте в своём темпе.",
              ),
            ],
          ].map(([a, b]) => (
            <div className="benefit" key={a}>
              <ArrowUpRight size={19} />
              <div>
                <h3>{a}</h3>
                <p>{b}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="section testimonials">
        <div className="section-heading">
          <h2>
            {s.t("Imagine the possibilities.", "Представьте возможности.")}
          </h2>
          <span className="muted">
            {s.t(
              "Illustrative testimonials · fictional personas",
              "Демонстрационные отзывы · вымышленные персонажи",
            )}
          </span>
        </div>
        <div className="quotes">
          {[
            [
              s.t(
                "“Seeing the homes alongside their locations makes choosing a destination feel natural.”",
                "«Когда видишь дома рядом с их локациями, выбрать направление гораздо проще».",
              ),
              "Alex M.",
            ],
            [
              s.t(
                "“I can compare the spaces that matter to me, and come back to my favourites whenever I like.”",
                "«Можно сравнить важные для меня пространства и вернуться к избранному в любой момент».",
              ),
              "Sofia K.",
            ],
          ].map(([q, n]) => (
            <blockquote key={n}>
              <p>{q}</p>
              <footer>
                {n}
                <span>{s.t("Demo persona", "Демоперсонаж")}</span>
              </footer>
            </blockquote>
          ))}
        </div>
        <div className="catalog-stats">
          <span>
            <strong>12</strong>
            {s.t("Demo properties", "Демообъектов")}
          </span>
          <span>
            <strong>05</strong>
            {s.t("World destinations", "Городов мира")}
          </span>
          <span>
            <strong>04</strong>
            {s.t("Ways to call it home", "Типа недвижимости")}
          </span>
        </div>
      </section>
      <section className="section contact-section">
        <div>
          <h2>
            {s.t(
              "Where does your\nnext chapter begin?",
              "Где начинается\nваша новая глава?",
            )}
          </h2>
          <p>
            {s.t(
              "Tell us what you are looking for. Explore the enquiry experience in this portfolio demo.",
              "Расскажите, что вы ищете. Оцените сценарий обращения в этой портфолио-демоверсии.",
            )}
          </p>
        </div>
        <ContactForm />
      </section>
    </>
  );
}
export function Catalog() {
  const s = useApp(),
    [params, setParams] = useSearchParams(),
    applied = useMemo(() => parseFilters(params), [params]),
    [draft, setDraft] = useState<Filters>(applied),
    [open, setOpen] = useState(false),
    [sort, setSort] = useState("popular"),
    [view, setView] = useState<"map" | "list">("map"),
    [active, setActive] = useState("");
  useEffect(() => setDraft(applied), [params]);
  const results = useMemo(
    () =>
      sortProperties(
        filterProperties(s.all, applied, s.settings.currency),
        sort,
      ),
    [s.all, applied, sort, s.settings.currency],
  );
  const set = (k: keyof Filters, v: string | string[]) =>
    setDraft((f) => ({ ...f, [k]: v }));
  const reset = () => {
    setDraft({ ...emptyFilters, deal: applied.deal });
    setParams(filterParams({ ...emptyFilters, deal: applied.deal }));
    setActive("");
  };
  return (
    <div className="catalog-page">
      <div className="catalog-heading">
        <div>
          <h1>
            {s.t(
              applied.deal === "rent"
                ? "Extraordinary stays."
                : "Exceptional homes.",
              applied.deal === "rent"
                ? "Исключительная аренда."
                : "Исключительные дома.",
            )}
          </h1>
          <p>
            {s.t(
              "A different way to find your place in the world.",
              "Новый способ найти своё место в мире.",
            )}
          </p>
        </div>
        <div className="segmented">
          {["buy", "rent"].map((d) => (
            <button
              key={d}
              className={applied.deal === d ? "active" : ""}
              onClick={() => setParams(filterParams({ ...applied, deal: d }))}
            >
              {s.t(
                d === "buy" ? "Buy" : "Rent",
                d === "buy" ? "Купить" : "Арендовать",
              )}
            </button>
          ))}
        </div>
      </div>
      <div className="catalog-toolbar">
        <form
          className="catalog-search"
          onSubmit={(e) => {
            e.preventDefault();
            setParams(filterParams({ ...applied, q: draft.q }));
            setActive("");
          }}
        >
          <input
            aria-label={s.t("Search properties", "Поиск объектов")}
            placeholder={s.t(
              "City, neighbourhood or residence…",
              "Город, район или название…",
            )}
            value={draft.q}
            onChange={(e) => set("q", e.target.value)}
          />
          <button className="icon-button" aria-label={s.t("Search", "Искать")}>
            <ArrowRight size={18} />
          </button>
        </form>
        <Button secondary onClick={() => setOpen(true)}>
          <SlidersHorizontal size={17} />
          {s.t("Filters", "Фильтры")}
        </Button>
        <label className="sort-label">
          <span className="sr-only">{s.t("Sort results", "Сортировка")}</span>
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            {[
              ["popular", "Curated order", "Демопопулярность"],
              ["newest", "Newest first", "Сначала новые"],
              ["price-asc", "Price: low to high", "Цена по возрастанию"],
              ["price-desc", "Price: high to low", "Цена по убыванию"],
              ["area-asc", "Area: low to high", "Площадь по возрастанию"],
              ["area-desc", "Area: high to low", "Площадь по убыванию"],
            ].map(([v, en, ru]) => (
              <option key={v} value={v}>
                {s.t(en, ru)}
              </option>
            ))}
          </select>
        </label>
        <div className="mobile-view segmented">
          <button
            className={view === "map" ? "active" : ""}
            onClick={() => setView("map")}
            aria-label={s.t("Map view", "Карта")}
          >
            <MapIcon size={18} />
          </button>
          <button
            className={view === "list" ? "active" : ""}
            onClick={() => setView("list")}
            aria-label={s.t("List view", "Список")}
          >
            <List size={18} />
          </button>
        </div>
      </div>
      <div className="results-line">
        <span>
          {results.length} {s.t("properties found", "объектов найдено")}
          {applied.city &&
            ` · ${s.settings.lang === "ru" ? cities.find((c) => c.name === applied.city)?.ru : applied.city}`}
        </span>
        <button className="text-button" onClick={reset}>
          {s.t("Reset filters", "Сбросить фильтры")}
        </button>
        <span>
          {s.t("Fixed demo exchange rates", "Фиксированные демокурсы")}
        </span>
      </div>
      <div className={`catalog-split view-${view}`}>
        <div className="catalog-results">
          {results.length ? (
            results.map((p) => (
              <div
                key={p.id}
                className={active === p.id ? "selected-result" : ""}
              >
                <PropertyCard p={p} small />
                <button
                  className="text-button map-locate"
                  onClick={() => {
                    setActive(p.id);
                    setView("map");
                  }}
                >
                  <MapIcon size={13} />
                  {s.t("Show on map", "На карте")}
                </button>
              </div>
            ))
          ) : (
            <Empty
              title={s.t("A little too specific.", "Пока ничего не найдено.")}
              text={s.t(
                "No homes match these filters. Reset them to explore more.",
                "Нет объектов с такими параметрами. Сбросьте фильтры для нового поиска.",
              )}
            />
          )}
        </div>
        <div className="catalog-map">
          <Suspense fallback={<MapLoading />}>
            <PropertyMap items={results} active={active} onSelect={setActive} />
          </Suspense>
        </div>
      </div>
      {open && (
        <Modal
          drawer
          title={s.t("Find your perspective", "Параметры поиска")}
          onClose={() => setOpen(false)}
        >
          <form
            className="form"
            onSubmit={(e) => {
              e.preventDefault();
              setParams(filterParams(draft));
              setActive("");
              setOpen(false);
            }}
          >
            <label>
              {s.t("Destination", "Город")}
              <select
                value={draft.city}
                onChange={(e) => set("city", e.target.value)}
              >
                <option value="">
                  {s.t("All destinations", "Все города")}
                </option>
                {cities.map((c) => (
                  <option value={c.name} key={c.name}>
                    {s.settings.lang === "ru" ? c.ru : c.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="field-row">
              <label>
                {s.t("Transaction", "Сделка")}
                <select
                  value={draft.deal}
                  onChange={(e) => set("deal", e.target.value)}
                >
                  <option value="">{s.t("All", "Все")}</option>
                  <option value="buy">{s.label("buy")}</option>
                  <option value="rent">{s.label("rent")}</option>
                </select>
              </label>
              <label>
                {s.t("Property type", "Тип объекта")}
                <select
                  value={draft.type}
                  onChange={(e) => set("type", e.target.value)}
                >
                  <option value="">{s.t("All types", "Все типы")}</option>
                  {kinds.map((k) => (
                    <option value={k} key={k}>
                      {s.label(k)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {[
              [
                "minPrice",
                "maxPrice",
                s.t(
                  `Price (${s.settings.currency})`,
                  `Цена (${s.settings.currency})`,
                ),
              ],
              ["minArea", "maxArea", s.t("Area (m²)", "Площадь (м²)")],
            ].map(([min, max, label]) => (
              <fieldset key={min}>
                <legend>{label}</legend>
                <div className="field-row">
                  <label>
                    {s.t("Minimum", "От")}
                    <input
                      type="number"
                      min="0"
                      value={draft[min as keyof Filters] as string}
                      onChange={(e) =>
                        set(min as keyof Filters, e.target.value)
                      }
                    />
                  </label>
                  <label>
                    {s.t("Maximum", "До")}
                    <input
                      type="number"
                      min={(draft[min as keyof Filters] as string) || "0"}
                      value={draft[max as keyof Filters] as string}
                      onChange={(e) =>
                        set(max as keyof Filters, e.target.value)
                      }
                    />
                  </label>
                </div>
              </fieldset>
            ))}
            <div className="field-row">
              {(["beds", "baths"] as const).map((k) => (
                <label key={k}>
                  {s.t(
                    k === "beds" ? "Minimum bedrooms" : "Minimum bathrooms",
                    k === "beds" ? "Спален от" : "Ванных от",
                  )}
                  <input
                    type="number"
                    min="0"
                    max="30"
                    value={draft[k]}
                    onChange={(e) => set(k, e.target.value)}
                  />
                </label>
              ))}
            </div>
            <fieldset>
              <legend>{s.t("Amenities", "Удобства")}</legend>
              <div className="checks-grid">
                {amenities.map((a) => (
                  <label className="check" key={a}>
                    <input
                      type="checkbox"
                      checked={draft.amenities.includes(a)}
                      onChange={(e) =>
                        set(
                          "amenities",
                          e.target.checked
                            ? [...draft.amenities, a]
                            : draft.amenities.filter((x) => x !== a),
                        )
                      }
                    />
                    {s.label(a)}
                  </label>
                ))}
              </div>
            </fieldset>
            <Button type="submit">
              {s.t("Apply filters", "Применить фильтры")}
              <ArrowRight size={17} />
            </Button>
            <Button
              secondary
              onClick={() => setDraft({ ...emptyFilters, deal: applied.deal })}
            >
              {s.t("Clear selection", "Очистить параметры")}
            </Button>
          </form>
        </Modal>
      )}
    </div>
  );
}
export function Detail() {
  const { slug } = useParams(),
    s = useApp(),
    p = s.all.find((p) => p.slug === slug),
    [gallery, setGallery] = useState<number | null>(null),
    [enquiry, setEnquiry] = useState(false),
    [deposit, setDeposit] = useState(20),
    [years, setYears] = useState(20),
    [rate, setRate] = useState(4.5);
  useEffect(() => {
    setGallery(null);
    setEnquiry(false);
    setDeposit(20);
    setYears(20);
    setRate(4.5);
  }, [slug]);
  if (!s.loaded && !p) return <MapLoading />;
  if (!p) return <NotFound />;
  const payment = monthlyPayment(
    p.price,
    (p.price * deposit) / 100,
    years,
    rate,
  );
  const similar = s.all
    .filter((x) => x.id !== p.id && x.deal === p.deal)
    .slice(0, 3);
  return (
    <>
      <div className="detail-top">
        <Link className="text-link" to={`/properties?deal=${p.deal}`}>
          {s.t("Collection", "Коллекция")}
        </Link>
        <span>/</span>
        <span>{p.name}</span>
        <Share p={p} />
      </div>
      <section className="detail-hero">
        <button
          className="detail-cover"
          onClick={() => setGallery(0)}
          aria-label={s.t("Open gallery", "Открыть галерею")}
        >
          <PhotoView photo={p.photos[0]} alt={p.name} eager />
          <span>
            <Maximize2 size={15} />
            {s.t("Explore gallery", "Смотреть галерею")} · {p.photos.length}
          </span>
        </button>
        <div className="detail-summary">
          <div className="location-line">
            {s.settings.lang === "ru"
              ? cities.find((c) => c.name === p.city)?.ru
              : p.city}{" "}
            · {p.country[s.settings.lang]}
          </div>
          <h1>{p.name}</h1>
          <p>
            {p.district} ·{" "}
            {s.t("Illustrative location", "Демонстрационная локация")}
          </p>
          <div className="detail-price">{s.price(p)}</div>
          <span className="muted">
            {s.label(p.deal)} · {s.label(p.type)}
          </span>
          <div className="detail-facts">
            <span>
              <Maximize2 />
              {p.area}
              <small>{s.t("square metres", "квадратных метров")}</small>
            </span>
            <span>
              <BedDouble />
              {p.beds}
              <small>{s.t("bedrooms", "спален")}</small>
            </span>
            <span>
              <Bath />
              {p.baths}
              <small>{s.t("bathrooms", "ванных")}</small>
            </span>
          </div>
          <Button
            onClick={() => {
              setEnquiry(true);
              if (!s.session) s.setLoginOpen(true);
            }}
          >
            {s.t("Enquire about this home", "Оставить заявку")}
            <ArrowUpRight size={18} />
          </Button>
          <div className="detail-actions">
            <Button secondary onClick={() => s.toggleFavorite(p.id)}>
              <Heart
                size={17}
                fill={s.favorites.includes(p.id) ? "currentColor" : "none"}
              />
              {s.favorites.includes(p.id)
                ? s.t("Saved", "Сохранено")
                : s.t("Save home", "Сохранить")}
            </Button>
            <Button secondary onClick={() => s.toggleCompare(p)}>
              <Scale size={17} />
              {s.compare.includes(p.id)
                ? s.t("Selected", "Выбрано")
                : s.t("Compare", "Сравнить")}
            </Button>
          </div>
        </div>
      </section>
      <section className="section detail-story">
        <h2>
          {s.t("Space to live differently.", "Пространство для новой жизни.")}
        </h2>
        <div>
          <p className="large-copy">{p.description[s.settings.lang]}</p>
          <p className="muted">
            {s.t(
              "A fictional listing with illustrative architectural imagery. It is not a real property offer.",
              "Вымышленное объявление с иллюстративными архитектурными изображениями. Не является реальным предложением недвижимости.",
            )}
          </p>
          <div className="amenities">
            {p.amenities.map((a) => (
              <span key={a}>
                <Check size={16} />
                {s.label(a)}
              </span>
            ))}
          </div>
          <h3>{s.t("Architecture & details", "Архитектура и детали")}</h3>
          <p>{p.features[s.settings.lang]}</p>
        </div>
      </section>
      <section className="section detail-gallery">
        {p.photos.slice(1).map((photo, i) => (
          <button
            key={i}
            onClick={() => setGallery(i + 1)}
            aria-label={`${s.t("Open image", "Открыть фото")} ${i + 2}`}
          >
            <PhotoView
              photo={photo}
              alt={`${p.name}, ${s.t("view", "ракурс")} ${i + 2}`}
            />
            <Maximize2 size={18} />
          </button>
        ))}
      </section>
      <section className="section">
        <div className="section-heading">
          <h2>{s.t("A place in the world.", "Место на карте мира.")}</h2>
          <p>
            {p.district} ·{" "}
            {s.t(
              "Approximate demo coordinates",
              "Приблизительные демокоординаты",
            )}
          </p>
        </div>
        <div className="detail-map">
          <Suspense fallback={<MapLoading />}>
            <PropertyMap items={[p]} />
          </Suspense>
        </div>
      </section>
      {p.deal === "buy" && (
        <section className="section calculator">
          <div>
            <h2>{s.t("Explore the numbers.", "Рассчитайте возможности.")}</h2>
            <p>
              {s.t(
                "An illustrative monthly payment estimate. Not a financing offer. Taxes, fees and country-specific lending conditions are not included.",
                "Иллюстративная оценка ежемесячного платежа. Не является финансовым предложением. Налоги, комиссии и условия кредитования конкретной страны не учтены.",
              )}
            </p>
          </div>
          <div className="calculator-panel">
            <label>
              {s.t("Property value", "Стоимость объекта")}
              <input readOnly value={s.money(p.price)} />
            </label>
            <div className="field-row">
              <label>
                {s.t("Down payment (%)", "Первоначальный взнос (%)")}
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={Number.isFinite(deposit) ? deposit : ""}
                  onChange={(e) =>
                    setDeposit(
                      e.target.value === "" ? NaN : Number(e.target.value),
                    )
                  }
                />
              </label>
              <label>
                {s.t("Term (years)", "Срок (лет)")}
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={Number.isFinite(years) ? years : ""}
                  onChange={(e) =>
                    setYears(
                      e.target.value === "" ? NaN : Number(e.target.value),
                    )
                  }
                />
              </label>
              <label>
                {s.t("Annual rate (%)", "Годовая ставка (%)")}
                <input
                  type="number"
                  min="0"
                  max="30"
                  step=".1"
                  value={Number.isFinite(rate) ? rate : ""}
                  onChange={(e) =>
                    setRate(
                      e.target.value === "" ? NaN : Number(e.target.value),
                    )
                  }
                />
              </label>
            </div>
            <div className="payment" aria-live="polite">
              <span>
                {s.t(
                  "Estimated monthly payment",
                  "Ориентировочный платёж в месяц",
                )}
              </span>
              <strong>{payment === null ? "—" : s.money(payment)}</strong>
              {payment === null && (
                <p role="alert">
                  {s.t(
                    "Use a deposit of 0–100%, a term of 1–50 years and a rate of 0–30%.",
                    "Укажите взнос 0–100%, срок 1–50 лет и ставку 0–30%.",
                  )}
                </p>
              )}
            </div>
            <p className="muted">
              {s.t(
                "Currency conversion uses fixed demo rates.",
                "Пересчёт валют выполнен по фиксированным демокурсам.",
              )}
            </p>
          </div>
        </section>
      )}
      <section className="section">
        <div className="section-heading">
          <h2>{s.t("Another perspective.", "Другой взгляд.")}</h2>
          <Link className="text-link" to={`/properties?deal=${p.deal}`}>
            {s.t("Explore collection", "Смотреть коллекцию")}
            <ArrowUpRight size={17} />
          </Link>
        </div>
        <div className="property-grid">
          {similar.map((x) => (
            <PropertyCard key={x.id} p={x} />
          ))}
        </div>
      </section>
      <section className="section detail-cta">
        <h2>
          {s.t(
            "Could this be your next chapter?",
            "Здесь начнётся ваша новая глава?",
          )}
        </h2>
        <Button
          onClick={() => {
            setEnquiry(true);
            if (!s.session) s.setLoginOpen(true);
          }}
        >
          {s.t("Start a demo enquiry", "Оформить демозаявку")}
          <ArrowUpRight size={18} />
        </Button>
      </section>
      {gallery !== null && (
        <Gallery p={p} index={gallery} onClose={() => setGallery(null)} />
      )}{" "}
      {enquiry && !s.loginOpen && (
        <Modal
          drawer
          title={s.t("Let’s look closer.", "Посмотрим поближе.")}
          onClose={() => setEnquiry(false)}
        >
          {s.session ? (
            <>
              <p>{p.name}</p>
              <ContactForm property={p} onDone={() => setEnquiry(false)} />
            </>
          ) : (
            <>
              <p>
                {s.t(
                  "Start a demo session to continue your enquiry.",
                  "Начните демосессию, чтобы продолжить оформление заявки.",
                )}
              </p>
              <Button onClick={() => s.setLoginOpen(true)}>
                {s.t("Demo sign in", "Демовход")}
              </Button>
            </>
          )}
        </Modal>
      )}
    </>
  );
}
export function Favorites() {
  const s = useApp(),
    items = s.all.filter((p) => s.favorites.includes(p.id));
  return (
    <section className="section page-section">
      <div className="section-heading">
        <div>
          <h1>{s.t("Your own collection.", "Ваша личная коллекция.")}</h1>
          <p>
            {s.t(
              "Saved in this browser. A little closer to your next home.",
              "Сохранено в этом браузере. На шаг ближе к вашему дому.",
            )}
          </p>
        </div>
        <Button secondary onClick={() => s.setCompareOpen(true)}>
          <Scale size={18} />
          {s.t("Compare", "Сравнить")} ({s.compare.length}/2)
        </Button>
      </div>
      {items.length ? (
        <div className="property-grid">
          {items.map((p) => (
            <PropertyCard key={p.id} p={p} />
          ))}
        </div>
      ) : (
        <Empty
          title={s.t("Make room for favourites.", "Здесь будет ваша подборка.")}
          text={s.t(
            "Tap the heart on a home to keep it here. No sign-in needed.",
            "Нажмите на сердце у объекта, чтобы сохранить его здесь. Вход не требуется.",
          )}
        />
      )}
    </section>
  );
}
export function About() {
  const s = useApp();
  return (
    <>
      <section className="about-hero section">
        <h1>
          {s.t(
            "A different view\nof belonging.",
            "Новый взгляд\nна своё место в мире.",
          )}
        </h1>
        <p>
          {s.t(
            "NEXORA is a concept for a more considered way to explore international real estate. Built to demonstrate what thoughtful design and working technology can make possible.",
            "NEXORA — концепция осмысленного поиска международной недвижимости. Проект показывает возможности продуманного дизайна и работающих технологий.",
          )}
        </p>
        <PhotoView
          photo={{ src: "/media/dubai-skyline.jpg" }}
          alt={s.t(
            "Dubai skyline, photograph by Sirav Talwar",
            "Панорама Дубая, фотограф Sirav Talwar",
          )}
        />
      </section>
      <section className="section detail-story">
        <h2>{s.t("Home is a perspective.", "Дом — это ваш взгляд на мир.")}</h2>
        <div className="large-copy">
          {s.t(
            "A location is only the beginning. Light, space, architecture and the rhythm of a city shape how we live. NEXORA brings these perspectives together, giving each home room to tell its story.",
            "Локация — только начало. Свет, пространство, архитектура и ритм города формируют нашу жизнь. NEXORA объединяет эти перспективы и даёт каждому дому возможность рассказать свою историю.",
          )}
        </div>
      </section>
      <section className="section">
        <h2>{s.t("The idea, in motion.", "Развитие идеи.")}</h2>
        <p>
          {s.t(
            "A conceptual product roadmap, not a company history.",
            "Концептуальный план развития продукта, а не история компании.",
          )}
        </p>
        <div className="timeline">
          {[
            [
              s.t("Explore", "Исследовать"),
              s.t(
                "Bring five destinations into one geographical experience.",
                "Объединить пять направлений в одном географическом поиске.",
              ),
            ],
            [
              s.t("Understand", "Понять"),
              s.t(
                "Make space, architecture and costs easier to compare.",
                "Сделать сравнение пространства, архитектуры и стоимости понятнее.",
              ),
            ],
            [
              s.t("Make it personal", "Персонализировать"),
              s.t(
                "Save collections and publish illustrative homes locally.",
                "Сохранять подборки и размещать демонстрационные объекты локально.",
              ),
            ],
          ].map(([a, b], i) => (
            <div key={a}>
              <span>{String(i + 1).padStart(2, "0")}</span>
              <h3>{a}</h3>
              <p>{b}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="section about-tech">
        <Globe2 size={40} />
        <h2>
          {s.t(
            "Real interactions.\nAn imagined world.",
            "Настоящие взаимодействия.\nВымышленный мир.",
          )}
        </h2>
        <p>
          {s.t(
            "A 3D Earth, interactive maps, responsive galleries and browser-local persistence power this portfolio experience. All properties, prices and testimonials are demonstrations. No real brokerage, transactions or message delivery take place.",
            "3D-глобус, интерактивные карты, адаптивные галереи и локальное хранение данных создают этот портфолио-проект. Все объекты, цены и отзывы демонстрационные. Реального посредничества, сделок и отправки сообщений нет.",
          )}
        </p>
        <Link className="button" to="/properties?deal=buy">
          {s.t("Explore the collection", "Исследовать коллекцию")}
          <ArrowUpRight size={18} />
        </Link>
      </section>
    </>
  );
}
export function NotFound() {
  const s = useApp();
  return (
    <section className="section page-section">
      <Empty
        title={s.t("A place yet to be found.", "Это место ещё не найдено.")}
        text={s.t(
          "This page or property does not exist. Return to the collection.",
          "Эта страница или объект не существует. Вернитесь к коллекции.",
        )}
      />
    </section>
  );
}
