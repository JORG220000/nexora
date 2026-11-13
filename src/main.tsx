import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  createBrowserRouter,
  RouterProvider,
  Outlet,
  Link,
  NavLink,
  useLocation,
  useRouteError,
} from "react-router-dom";
import {
  ArrowUpRight,
  ArrowRight,
  Heart,
  UserRound,
  Sun,
  Moon,
  Menu,
  X,
  Scale,
  Settings2,
  MoveUpRight,
} from "lucide-react";
import "@fontsource/space-grotesk/400.css";
import "@fontsource/space-grotesk/500.css";
import "@fontsource/space-grotesk/600.css";
import "@fontsource/space-grotesk/700.css";
import "@fontsource/manrope/cyrillic-400.css";
import "@fontsource/manrope/cyrillic-500.css";
import "@fontsource/manrope/cyrillic-600.css";
import "@fontsource/manrope/cyrillic-700.css";
import { Provider, useApp } from "./state";
import { Home, Catalog, Detail, Favorites, About, NotFound } from "./pages";
import { Account, Wizard } from "./account";
import { Button, Comparison, Login, Modal } from "./components";
import type { Currency } from "./model";
import "./style.css";
import { Intro, Enhancements } from "./enhancements";
import { publicAsset } from "./paths";
function Layout() {
  const s = useApp(),
    loc = useLocation(),
    [menu, setMenu] = useState(false),
    [preferences, setPreferences] = useState(false),
    cursor = useRef<HTMLDivElement>(null);
  const main = useRef<HTMLElement>(null);
  useEffect(() => {
    setMenu(false);
    window.scrollTo({ top: 0, behavior: "instant" });
    const names: Record<string, [string, string]> = {
      "/": ["The world is your home", "Целый мир — ваш дом"],
      "/properties": ["Collection", "Коллекция"],
      "/favorites": ["Your collection", "Избранное"],
      "/account": ["Your account", "Личный кабинет"],
      "/list-property": ["List your property", "Разместить объект"],
      "/about": ["Our perspective", "О проекте"],
    };
    const name = names[loc.pathname] || [
      "Exceptional home",
      "Исключительный дом",
    ];
    document.title = "NEXORA — " + s.t(...name);
    const description = document.querySelector('meta[name="description"]');
    description?.setAttribute(
      "content",
      s.t(
        "A demonstration platform for exceptional international real estate. Explore, save and compare fictional luxury homes.",
        "Демонстрационная платформа международной недвижимости. Исследуйте, сохраняйте и сравнивайте вымышленные элитные объекты.",
      ),
    );
    main.current?.focus({ preventScroll: true });
  }, [loc.pathname, s.settings.lang]);
  useEffect(() => {
    if (s.reduced || !matchMedia("(pointer:fine)").matches) return;
    const move = (e: PointerEvent) => {
      if (cursor.current) {
        cursor.current.style.transform = `translate3d(${e.clientX}px,${e.clientY}px,0)`;
        cursor.current.style.opacity = (e.target as Element).closest("button,a")
          ? "1"
          : "0";
      }
    };
    window.addEventListener("pointermove", move);
    return () => window.removeEventListener("pointermove", move);
  }, [s.reduced]);
  useEffect(() => {
    if (s.reduced) return;
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("revealed");
            observer.unobserve(e.target);
          }
        }),
      { threshold: 0.08 },
    );
    document.querySelectorAll(".section").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [loc.pathname, s.reduced]);
  const nav = [
    ["/properties?deal=buy", s.t("Buy", "Купить")],
    ["/properties?deal=rent", s.t("Rent", "Арендовать")],
    ["/about", s.t("Our perspective", "О проекте")],
  ];
  return (
    <>
      <Intro />
      <Enhancements />
      <a href="#main" className="skip-link">
        {s.t("Skip to content", "К содержимому")}
      </a>
      <header className="site-header">
        <Link
          to="/"
          className="wordmark"
          aria-label={s.t("NEXORA home", "NEXORA главная")}
        >
          <svg viewBox="0 0 28 28" aria-hidden="true">
            <path d="M4 23V5l20 18V5M4 5h5M19 23h5" />
          </svg>
          NEXORA<span>®</span>
        </Link>
        <nav
          className="desktop-nav"
          aria-label={s.t("Main navigation", "Основная навигация")}
        >
          {nav.map(([to, label]) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                isActive &&
                (to.includes("?")
                  ? loc.pathname + loc.search === to
                  : loc.pathname === to)
                  ? "active"
                  : ""
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="header-actions">
          <button
            className="language-button"
            aria-label={s.t("Switch to Russian", "Переключить на английский")}
            onClick={() =>
              s.setSettings((x) => ({
                ...x,
                lang: x.lang === "en" ? "ru" : "en",
              }))
            }
          >
            {s.settings.lang.toUpperCase()}
          </button>
          <label className="currency-switch">
            <span className="sr-only">{s.t("Currency", "Валюта")}</span>
            <select
              value={s.settings.currency}
              onChange={(e) =>
                s.setSettings((x) => ({
                  ...x,
                  currency: e.target.value as Currency,
                }))
              }
            >
              <option>USD</option>
              <option>EUR</option>
              <option>AED</option>
            </select>
          </label>
          <button
            className="icon-button theme-toggle"
            aria-label={s.t("Switch theme", "Переключить тему")}
            onClick={() =>
              s.setSettings((x) => ({
                ...x,
                theme: x.theme === "dark" ? "light" : "dark",
              }))
            }
          >
            {s.settings.theme === "dark" ? (
              <Sun size={17} />
            ) : (
              <Moon size={17} />
            )}
          </button>
          <Link
            to="/favorites"
            className="icon-button favorite-nav"
            aria-label={s.t("Favourites", "Избранное")}
          >
            <Heart size={18} />
            {s.favorites.length > 0 && <sup>{s.favorites.length}</sup>}
          </Link>
          <Link
            to="/account"
            className="icon-button"
            aria-label={s.t("Account", "Личный кабинет")}
          >
            <UserRound size={18} />
          </Link>
          <Link to="/list-property" className="button header-list">
            {s.t("List your property", "Разместить объект")}
            <ArrowUpRight size={15} />
          </Link>
          <button
            className="icon-button mobile-menu"
            onClick={() => setMenu(!menu)}
            aria-expanded={menu}
            aria-label={s.t("Open navigation", "Открыть меню")}
          >
            <Menu size={21} />
          </button>
        </div>
      </header>
      {menu && (
        <Modal
          title={s.t("Explore NEXORA", "Откройте NEXORA")}
          onClose={() => setMenu(false)}
        >
          <nav className="mobile-nav">
            {[
              ...nav,
              ["/favorites", s.t("Favourites", "Избранное")],
              ["/account", s.t("Account", "Кабинет")],
              [
                "/list-property",
                s.t("List your property", "Разместить объект"),
              ],
            ].map(([to, label]) => (
              <Link key={to} to={to} onClick={() => setMenu(false)}>
                {label}
                <ArrowUpRight size={20} />
              </Link>
            ))}
          </nav>
          <Button
            secondary
            onClick={() => {
              setMenu(false);
              setPreferences(true);
            }}
          >
            <Settings2 size={18} />
            {s.t("Preferences", "Настройки")}
          </Button>
        </Modal>
      )}
      <main
        id="main"
        tabIndex={-1}
        ref={main}
        key={loc.pathname}
        className="route-enter"
      >
        <Outlet />
      </main>
      <footer className="site-footer">
        <div className="footer-top">
          <Link to="/" className="wordmark">
            NEXORA<span>®</span>
          </Link>
          <p>{s.t("THE WORLD IS YOUR HOME", "ЦЕЛЫЙ МИР — ВАШ ДОМ")}</p>
          <button
            className="text-button"
            onClick={() => {
              window.scrollTo({
                top: 0,
                behavior: s.reduced ? "instant" : "smooth",
              });
              document
                .querySelector<HTMLAnchorElement>(".site-header a")
                ?.focus({ preventScroll: true });
            }}
          >
            {s.t("Back to top", "Наверх")}
            <MoveUpRight size={16} />
          </button>
        </div>
        <div className="footer-nav">
          <Link to="/properties?deal=buy">{s.t("Buy", "Купить")}</Link>
          <Link to="/properties?deal=rent">{s.t("Rent", "Арендовать")}</Link>
          <Link to="/about">{s.t("About NEXORA", "О NEXORA")}</Link>
          <Link to="/list-property">
            {s.t("List property", "Разместить объект")}
          </Link>
          <button className="text-button" onClick={() => setPreferences(true)}>
            {s.t("Preferences", "Настройки")}
            <Settings2 size={14} />
          </button>
        </div>
        <div className="footer-bottom">
          <span>
            © 2026 NEXORA · {s.t("Portfolio concept", "Портфолио-концепция")}
          </span>
          <p>
            {s.t(
              "Demo only. Fictional properties, prices and testimonials. No real enquiries or transactions. Data stays in this browser. Currency rates are illustrative.",
              "Демопроект. Вымышленные объекты, цены и отзывы. Без реальных заявок и сделок. Данные хранятся в этом браузере. Курсы валют демонстрационные.",
            )}
          </p>
          <a href={publicAsset("asset-credits.html")} target="_blank" rel="noreferrer">
            {s.t("Image credits", "Источники изображений")}
            <ArrowUpRight size={12} />
          </a>
        </div>
      </footer>
      {!s.notice && (
        <aside
          className="demo-notice"
          aria-label={s.t("Demonstration notice", "Уведомление о демоверсии")}
        >
          <div>
            <strong>
              {s.t("A world imagined.", "Мир, созданный воображением.")}
            </strong>
            <p>
              {s.t(
                "NEXORA is a portfolio demo. Homes, prices and testimonials are fictional. No real messages are sent.",
                "NEXORA — портфолио-демоверсия. Объекты, цены и отзывы вымышлены. Реальные сообщения не отправляются.",
              )}
            </p>
          </div>
          <button
            className="icon-button"
            aria-label={s.t("Dismiss demo notice", "Закрыть демоуведомление")}
            onClick={() => s.setNotice(true)}
          >
            <X size={18} />
          </button>
        </aside>
      )}
      {s.storageError && (
        <div className="storage-notice" role="status">
          {s.t(
            "Browser storage is unavailable. Changes may not persist.",
            "Хранилище браузера недоступно. Изменения могут не сохраниться.",
          )}
        </div>
      )}
      {s.toast && (
        <div className="toast" role="status">
          {s.toast}
        </div>
      )}
      {s.compare.length > 0 && (
        <button
          className="compare-dock button"
          onClick={() => s.setCompareOpen(true)}
        >
          <Scale size={17} />
          {s.t("Compare", "Сравнить")} {s.compare.length}/2
        </button>
      )}
      {s.compareOpen && <Comparison />}
      {s.loginOpen && <Login />}
      {preferences && (
        <Modal
          title={s.t("Make it yours.", "Ваши настройки.")}
          onClose={() => setPreferences(false)}
        >
          <div className="form">
            <label>
              {s.t("Currency", "Валюта")}
              <select
                value={s.settings.currency}
                onChange={(e) =>
                  s.setSettings((x) => ({
                    ...x,
                    currency: e.target.value as Currency,
                  }))
                }
              >
                <option>USD</option>
                <option>EUR</option>
                <option>AED</option>
              </select>
            </label>
            <label>
              {s.t("Appearance", "Внешний вид")}
              <select
                value={s.settings.theme}
                onChange={(e) =>
                  s.setSettings((x) => ({
                    ...x,
                    theme: e.target.value as "dark" | "light",
                  }))
                }
              >
                <option value="dark">{s.t("Dark", "Тёмная")}</option>
                <option value="light">{s.t("Light", "Светлая")}</option>
              </select>
            </label>
            <label className="check">
              <input
                type="checkbox"
                checked={s.settings.reduce}
                onChange={(e) =>
                  s.setSettings((x) => ({ ...x, reduce: e.target.checked }))
                }
              />
              {s.t("Reduce motion", "Уменьшить анимацию")}
            </label>
            <p>
              {s.t(
                "System reduced-motion preferences are always respected.",
                "Системная настройка уменьшения движения всегда учитывается.",
              )}
            </p>
            <p>
              {s.t(
                "Fixed demo rates: USD 1 = EUR 0.92 = AED 3.6725. Not current market quotes.",
                "Фиксированные демокурсы: 1 USD = 0,92 EUR = 3,6725 AED. Это не актуальные рыночные котировки.",
              )}
            </p>
          </div>
        </Modal>
      )}
      <div ref={cursor} className="custom-cursor" aria-hidden="true" />
    </>
  );
}
function ErrorPage() {
  useRouteError();
  return (
    <div className="empty">
      <h1>NEXORA</h1>
      <p>Something went wrong / Что-то пошло не так</p>
      <a className="button" href={import.meta.env.BASE_URL}>
        Return home / На главную
      </a>
    </div>
  );
}
const router = createBrowserRouter([
  {
    element: <Layout />,
    errorElement: <ErrorPage />,
    children: [
      { path: "/", element: <Home /> },
      { path: "/properties", element: <Catalog /> },
      { path: "/properties/:slug", element: <Detail /> },
      { path: "/favorites", element: <Favorites /> },
      { path: "/account", element: <Account /> },
      { path: "/list-property", element: <Wizard /> },
      { path: "/about", element: <About /> },
      { path: "*", element: <NotFound /> },
    ],
  },
], { basename: import.meta.env.BASE_URL });
createRoot(document.getElementById("root")!).render(
  <Provider>
    <RouterProvider router={router} />
  </Provider>,
);
