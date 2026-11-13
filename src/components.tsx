import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type FormEvent,
} from "react";
import { Link } from "react-router-dom";
import { publicAsset, propertyUrl } from "./paths";
import {
  ArrowUpRight,
  ArrowRight,
  Heart,
  Scale,
  X,
  Check,
  BedDouble,
  Bath,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  Share2,
} from "lucide-react";
import { useApp } from "./state";
import { cities, type Property, type Photo } from "./model";
export function PhotoView({
  photo,
  alt,
  className = "",
  eager = false,
}: {
  photo: Photo;
  alt: string;
  className?: string;
  eager?: boolean;
}) {
  return (
    <div
      className={`photo ${photo.frame !== undefined ? "sheet" : ""} ${className}`}
      role={photo.frame !== undefined ? "img" : undefined}
      aria-label={photo.frame !== undefined ? alt : undefined}
    >
      <img
        src={photo.src.startsWith("/") ? publicAsset(photo.src) : photo.src}
        alt={photo.frame !== undefined ? "" : alt}
        loading={eager ? "eager" : "lazy"}
        draggable={false}
        style={
          photo.frame !== undefined
            ? {
                left: `-${(photo.frame % 2) * 100}%`,
                top: `-${Math.floor(photo.frame / 2) * 100}%`,
              }
            : undefined
        }
      />
    </div>
  );
}
export function Button({
  children,
  onClick,
  secondary = false,
  type = "button",
  disabled = false,
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  secondary?: boolean;
  type?: "button" | "submit";
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type={type}
      className={`button ${secondary ? "secondary" : ""} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
export function Empty({ title, text }: { title: string; text: string }) {
  const { t } = useApp();
  return (
    <div className="empty">
      <span className="empty-orbit">
        <Heart size={28} />
      </span>
      <h2>{title}</h2>
      <p>{text}</p>
      <Link className="button" to="/properties?deal=buy">
        {t("Explore properties", "Смотреть недвижимость")}
        <ArrowRight size={17} />
      </Link>
    </div>
  );
}
export function Modal({
  title,
  onClose,
  children,
  wide = false,
  drawer = false,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
  drawer?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const { t } = useApp();
  useEffect(() => {
    const el = ref.current,
      prior = document.activeElement as HTMLElement;
    el?.showModal();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      el?.close();
      document.body.style.overflow = prev;
      prior?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={`${wide ? "wide" : ""} ${drawer ? "drawer" : ""}`}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      aria-label={title}
    >
      <div className="dialog-content">
        <div className="dialog-head">
          <h2>{title}</h2>
          <button
            className="icon-button"
            onClick={onClose}
            aria-label={t("Close", "Закрыть")}
          >
            <X />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
export function PropertyCard({
  p,
  small = false,
}: {
  p: Property;
  small?: boolean;
}) {
  const s = useApp(),
    ref = useRef<HTMLElement>(null);
  return (
    <article
      ref={ref}
      className={`property-card ${small ? "small" : ""}`}
      onPointerMove={(e) => {
        if (
          !s.reduced &&
          e.pointerType === "mouse" &&
          matchMedia("(hover:hover)").matches
        ) {
          const r = e.currentTarget.getBoundingClientRect();
          e.currentTarget.style.setProperty(
            "--tilt-x",
            `${(-(e.clientY - r.top - r.height / 2) / r.height) * 3}deg`,
          );
          e.currentTarget.style.setProperty(
            "--tilt-y",
            `${((e.clientX - r.left - r.width / 2) / r.width) * 3}deg`,
          );
        }
      }}
      onPointerLeave={() => {
        ref.current?.style.setProperty("--tilt-x", "0deg");
        ref.current?.style.setProperty("--tilt-y", "0deg");
      }}
    >
      <div className="card-image">
        <Link to={`/properties/${p.slug}`} tabIndex={-1} aria-hidden="true">
          <PhotoView photo={p.photos[0]} alt={p.name} />
        </Link>
        <span className="image-tag">{s.label(p.deal)}</span>
        <div className="card-actions">
          <button
            className="icon-button"
            aria-label={
              s.favorites.includes(p.id)
                ? s.t("Remove from favorites", "Убрать из избранного")
                : s.t("Save property", "В избранное")
            }
            aria-pressed={s.favorites.includes(p.id)}
            onClick={() => s.toggleFavorite(p.id)}
          >
            <Heart
              size={18}
              fill={s.favorites.includes(p.id) ? "currentColor" : "none"}
            />
          </button>
          <button
            className="icon-button"
            aria-label={s.t("Compare property", "Сравнить объект")}
            aria-pressed={s.compare.includes(p.id)}
            onClick={() => s.toggleCompare(p)}
          >
            <Scale size={18} />
          </button>
        </div>
      </div>
      <div className="card-copy">
        <div className="location-line">
          {s.settings.lang === "ru"
            ? cities.find((c) => c.name === p.city)?.ru
            : p.city}
          <span>{s.label(p.type)}</span>
        </div>
        <Link to={`/properties/${p.slug}`} className="card-title">
          {p.name}
          <ArrowUpRight size={19} />
        </Link>
        <div className="card-facts">
          <span>
            <Maximize2 size={14} />
            {p.area.toLocaleString()} {s.t("m²", "м²")}
          </span>
          <span>
            <BedDouble size={15} />
            {p.beds}
          </span>
          <span>
            <Bath size={15} />
            {p.baths}
          </span>
        </div>
        <p className="card-price">{s.price(p)}</p>
      </div>
    </article>
  );
}
export function Login() {
  const s = useApp();
  const [error, setError] = useState("");
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const d = new FormData(e.currentTarget),
      name = String(d.get("name")).trim(),
      email = String(d.get("email")).trim();
    if (name.length < 2 || !/^\S+@\S+\.\S+$/.test(email)) {
      setError(
        s.t(
          "Enter your name and a valid email.",
          "Введите имя и корректный email.",
        ),
      );
      return;
    }
    s.setSession({ name, email });
    s.setLoginOpen(false);
    s.notify(s.t("Demo session started.", "Демосессия начата."));
  }
  return (
    <Modal
      title={s.t("Your world, saved.", "Ваш мир — рядом.")}
      onClose={() => s.setLoginOpen(false)}
    >
      <p>
        {s.t(
          "A local demo session. No password, no secure account and no device synchronization. Use fictional details.",
          "Локальная демосессия без пароля, защищённого аккаунта и синхронизации устройств. Используйте вымышленные данные.",
        )}
      </p>
      <form onSubmit={submit} className="form">
        <label>
          {s.t("Name", "Имя")}
          <input
            name="name"
            required
            minLength={2}
            maxLength={80}
            autoComplete="name"
          />
        </label>
        <label>
          Email
          <input name="email" type="email" required autoComplete="email" />
        </label>
        {error && <p role="alert">{error}</p>}
        <Button type="submit">
          {s.t("Start demo session", "Начать демосессию")}
          <ArrowRight size={16} />
        </Button>
      </form>
      <Button
        secondary
        onClick={() => {
          s.setSession({ name: "Demo User", email: "demo@nexora.example" });
          s.setLoginOpen(false);
        }}
      >
        {s.t("Continue as Demo User", "Войти как Demo User")}
      </Button>
    </Modal>
  );
}
export function ContactForm({
  property,
  onDone,
}: {
  property?: Property;
  onDone?: () => void;
}) {
  const s = useApp(),
    [sent, setSent] = useState(false);
  if (sent)
    return (
      <div className="confirmation" role="status">
        <Check size={38} />
        <h3>{s.t("Demo request completed", "Демозаявка оформлена")}</h3>
        <p>
          {s.t(
            "Nothing was sent. This form demonstrates the enquiry flow only.",
            "Ничего не отправлено. Эта форма демонстрирует сценарий оформления заявки.",
          )}
        </p>
        {onDone && <Button onClick={onDone}>{s.t("Close", "Закрыть")}</Button>}
      </div>
    );
  return (
    <form
      className="form"
      onSubmit={(e) => {
        e.preventDefault();
        if (property && !s.session) {
          s.setLoginOpen(true);
          return;
        }
        setSent(true);
      }}
    >
      <p className="muted">
        {s.t(
          "Demo form. Messages are not sent or stored.",
          "Демонстрационная форма. Сообщения не отправляются и не сохраняются.",
        )}
      </p>
      <div className="field-row">
        <label>
          {s.t("Your name", "Ваше имя")}
          <input
            name="name"
            required
            minLength={2}
            maxLength={80}
            defaultValue={s.session?.name || ""}
            autoComplete="name"
          />
        </label>
        <label>
          Email
          <input
            type="email"
            name="email"
            required
            defaultValue={s.session?.email || ""}
            autoComplete="email"
          />
        </label>
      </div>
      <label>
        {s.t("Message", "Сообщение")}
        <textarea
          name="message"
          required
          minLength={10}
          maxLength={2000}
          placeholder={
            property
              ? s.t(
                  `I would like to explore ${property.name}.`,
                  `Хочу узнать больше об объекте ${property.name}.`,
                )
              : s.t(
                  "Tell us what home means to you.",
                  "Расскажите, какой дом вы ищете.",
                )
          }
        />
      </label>
      <label className="check">
        <input type="checkbox" required />
        {s.t(
          "I understand this is a demo and no message will be sent.",
          "Я понимаю, что это демоверсия и сообщение не будет отправлено.",
        )}
      </label>
      <Button type="submit">
        {s.t("Complete demo enquiry", "Оформить демозаявку")}
        <ArrowUpRight size={18} />
      </Button>
    </form>
  );
}
export function Comparison() {
  const s = useApp(),
    items = s.all.filter((p) => s.compare.includes(p.id));
  const rows: [string, (p: Property) => string][] = [
    [s.t("Price", "Цена"), s.price],
    [
      s.t("City", "Город"),
      (p) =>
        s.settings.lang === "ru"
          ? cities.find((c) => c.name === p.city)!.ru
          : p.city,
    ],
    [s.t("Property type", "Тип недвижимости"), (p) => s.label(p.type)],
    [s.t("Area", "Площадь"), (p) => `${p.area} ${s.t("m²", "м²")}`],
    [s.t("Bedrooms", "Спальни"), (p) => String(p.beds)],
    [s.t("Bathrooms", "Ванные"), (p) => String(p.baths)],
    [s.t("Amenities", "Удобства"), (p) => p.amenities.map(s.label).join(", ")],
    [s.t("Architecture", "Архитектура"), (p) => p.features[s.settings.lang]],
    [s.t("Transaction", "Сделка"), (p) => s.label(p.deal)],
  ];
  return (
    <Modal
      drawer
      wide
      title={s.t("A closer comparison", "Сравнить в деталях")}
      onClose={() => {
        s.setCompareOpen(false);
        s.setPendingCompare(null);
      }}
    >
      {s.pendingCompare && (
        <div className="notice-box">
          <p>
            {s.t(
              "Two homes are already selected. Choose one to replace with",
              "Уже выбрано два объекта. Выберите, какой заменить на",
            )}{" "}
            {s.pendingCompare.name}.
          </p>
          {items.map((p) => (
            <Button
              key={p.id}
              secondary
              onClick={() => {
                s.setCompare((a) =>
                  a.map((id) => (id === p.id ? s.pendingCompare!.id : id)),
                );
                s.setPendingCompare(null);
              }}
            >
              {s.t("Replace", "Заменить")} {p.name}
            </Button>
          ))}
        </div>
      )}
      {items.length === 0 ? (
        <p>
          {s.t(
            "Choose up to two homes with the same transaction type.",
            "Выберите до двух объектов одного типа сделки.",
          )}
        </p>
      ) : (
        <div className="comparison-scroll">
          <table className="comparison">
            <thead>
              <tr>
                <th>{s.t("Details", "Параметры")}</th>
                {items.map((p) => (
                  <th key={p.id}>
                    <PhotoView photo={p.photos[0]} alt={p.name} />
                    <Link
                      to={`/properties/${p.slug}`}
                      onClick={() => s.setCompareOpen(false)}
                    >
                      {p.name}
                    </Link>
                    <button
                      className="text-button"
                      onClick={() => s.toggleCompare(p)}
                    >
                      {s.t("Remove", "Убрать")}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(([label, fn]) => (
                <tr
                  key={label}
                  className={
                    items.length === 2 && fn(items[0]) !== fn(items[1])
                      ? "different"
                      : ""
                  }
                >
                  <th>{label}</th>
                  {items.map((p) => (
                    <td key={p.id}>{fn(p)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Modal>
  );
}
export function Gallery({
  p,
  index,
  onClose,
}: {
  p: Property;
  index: number;
  onClose: () => void;
}) {
  const s = useApp(),
    [i, setI] = useState(index),
    start = useRef(0);
  const move = (d: number) =>
    setI((v) => (v + d + p.photos.length) % p.photos.length);
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") move(1);
      if (e.key === "ArrowLeft") move(-1);
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, []);
  return (
    <Modal
      wide
      title={`${p.name} — ${i + 1} / ${p.photos.length}`}
      onClose={onClose}
    >
      <div
        className="gallery-full"
        onTouchStart={(e) => (start.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          const d = e.changedTouches[0].clientX - start.current;
          if (Math.abs(d) > 40) move(d < 0 ? 1 : -1);
        }}
      >
        <PhotoView
          photo={p.photos[i]}
          alt={`${p.name}, ${s.t("view", "ракурс")} ${i + 1}`}
          eager
        />
        <button
          className="icon-button prev"
          onClick={() => move(-1)}
          aria-label={s.t("Previous image", "Предыдущее фото")}
        >
          <ChevronLeft />
        </button>
        <button
          className="icon-button next"
          onClick={() => move(1)}
          aria-label={s.t("Next image", "Следующее фото")}
        >
          <ChevronRight />
        </button>
      </div>
    </Modal>
  );
}
export function Share({ p }: { p: Property }) {
  const s = useApp();
  return (
    <button
      className="icon-button"
      aria-label={s.t("Share property", "Поделиться объектом")}
      onClick={async () => {
        try {
          const url = propertyUrl(p.slug);
          if (navigator.share) await navigator.share({ title: p.name, url });
          else {
            await navigator.clipboard.writeText(url);
            s.notify(s.t("Link copied.", "Ссылка скопирована."));
          }
        } catch (e) {
          if ((e as Error).name !== "AbortError")
            s.notify(
              s.t(
                "Copy the address from your browser to share.",
                "Для отправки скопируйте адрес из строки браузера.",
              ),
            );
        }
      }}
    >
      <Share2 size={18} />
    </button>
  );
}
