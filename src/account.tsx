import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  Link,
  useNavigate,
  useSearchParams,
  useBlocker,
} from "react-router-dom";
import {
  ArrowRight,
  ArrowLeft,
  ArrowUpRight,
  Plus,
  LogOut,
  Upload,
  Trash2,
  Check,
  Image as ImageIcon,
  Pencil,
  UserRound,
  Heart,
  Building2,
} from "lucide-react";
import { useApp } from "./state";
import {
  cities,
  kinds,
  amenities,
  type Property,
  type Photo,
  type City,
  type Kind,
  type Deal,
} from "./model";
import { compressPhoto } from "./storage";
import { Button, Empty, Modal, PhotoView, PropertyCard } from "./components";
export function Account() {
  const s = useApp(),
    [tab, setTab] = useState("profile"),
    [deleting, setDeleting] = useState<Property | null>(null),
    [busy, setBusy] = useState(false);
  if (!s.session)
    return (
      <section className="section page-section account-intro">
        <UserRound size={40} />
        <h1>{s.t("A space of your own.", "Ваше личное пространство.")}</h1>
        <p>
          {s.t(
            "Start a demo session to explore your profile and publish homes. Everything stays in this browser.",
            "Начните демосессию, чтобы открыть профиль и разместить объекты. Все данные остаются в этом браузере.",
          )}
        </p>
        <Button onClick={() => s.setLoginOpen(true)}>
          {s.t("Start demo session", "Начать демосессию")}
          <ArrowRight size={18} />
        </Button>
      </section>
    );
  const saved = s.all.filter((p) => s.favorites.includes(p.id));
  return (
    <section className="section page-section">
      <div className="section-heading">
        <div>
          <h1>
            {s.t("Welcome,", "Здравствуйте,")} {s.session.name}.
          </h1>
          <p>
            {s.t(
              "Your browser-local workspace. No cloud synchronization.",
              "Ваше локальное пространство. Без облачной синхронизации.",
            )}
          </p>
        </div>
        <Link className="button" to="/list-property">
          <Plus size={18} />
          {s.t("List a property", "Разместить объект")}
        </Link>
      </div>
      <div className="account-tabs">
        {[
          ["profile", s.t("Profile", "Профиль"), UserRound],
          ["favorites", s.t("Favourites", "Избранное"), Heart],
          ["listings", s.t("My properties", "Мои объявления"), Building2],
        ].map(([id, label, Icon]) => {
          const I = Icon as typeof UserRound;
          return (
            <button
              key={String(id)}
              className={tab === id ? "active" : ""}
              onClick={() => setTab(String(id))}
            >
              <I size={17} />
              {String(label)}
            </button>
          );
        })}
      </div>
      {tab === "profile" ? (
        <div className="profile-card">
          <div className="avatar">
            {s.session.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h2>{s.session.name}</h2>
            <p>{s.session.email}</p>
            <p className="muted">
              {s.t(
                "Demo profile. This is not a protected account.",
                "Демопрофиль. Это не защищённый аккаунт.",
              )}
            </p>
          </div>
          <Button secondary onClick={() => s.setSession(null)}>
            <LogOut size={17} />
            {s.t("Sign out", "Выйти")}
          </Button>
        </div>
      ) : tab === "favorites" ? (
        saved.length ? (
          <div className="property-grid">
            {saved.map((p) => (
              <PropertyCard p={p} key={p.id} />
            ))}
          </div>
        ) : (
          <Empty
            title={s.t(
              "Your collection starts here.",
              "Начните вашу коллекцию.",
            )}
            text={s.t(
              "Save homes from the catalogue using the heart button.",
              "Сохраняйте объекты из каталога кнопкой с сердцем.",
            )}
          />
        )
      ) : s.own.length ? (
        <div className="property-grid">
          {s.own.map((p) => (
            <div key={p.id}>
              <PropertyCard p={p} />
              <div className="listing-controls">
                <Link className="text-link" to={`/list-property?edit=${p.id}`}>
                  <Pencil size={15} />
                  {s.t("Edit", "Редактировать")}
                </Link>
                <button className="text-button" onClick={() => setDeleting(p)}>
                  <Trash2 size={15} />
                  {s.t("Delete", "Удалить")}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty">
          <Building2 size={36} />
          <h2>
            {s.t(
              "A new home for your listing.",
              "Место для вашего объявления.",
            )}
          </h2>
          <p>
            {s.t(
              "Publish your first illustrative property in four simple steps.",
              "Разместите первый демонстрационный объект за четыре шага.",
            )}
          </p>
          <Link className="button" to="/list-property">
            {s.t("Create a listing", "Создать объявление")}
            <Plus size={18} />
          </Link>
        </div>
      )}
      {deleting && (
        <Modal
          title={s.t("Delete this property?", "Удалить этот объект?")}
          onClose={() => setDeleting(null)}
        >
          <p>{deleting.name}</p>
          <p>
            {s.t(
              "The listing and its photos will be removed from this browser. This cannot be undone.",
              "Объявление и его фотографии будут удалены из этого браузера. Действие нельзя отменить.",
            )}
          </p>
          <div className="field-row">
            <Button secondary onClick={() => setDeleting(null)}>
              {s.t("Cancel", "Отмена")}
            </Button>
            <Button
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await s.remove(deleting.id);
                  setDeleting(null);
                  s.notify(s.t("Listing deleted.", "Объявление удалено."));
                } catch {
                  s.notify(
                    s.t(
                      "Could not delete. Please try again.",
                      "Не удалось удалить. Повторите попытку.",
                    ),
                  );
                } finally {
                  setBusy(false);
                }
              }}
            >
              {s.t("Delete property", "Удалить объект")}
            </Button>
          </div>
        </Modal>
      )}
    </section>
  );
}
type Draft = {
  name: string;
  deal: Deal;
  type: Kind;
  city: City;
  price: string;
  period: "week" | "month";
  area: string;
  beds: string;
  baths: string;
  descriptionEn: string;
  descriptionRu: string;
  featuresEn: string;
  featuresRu: string;
  amenities: string[];
  photos: Photo[];
};
const blank: Draft = {
  name: "",
  deal: "buy",
  type: "villa",
  city: "Dubai",
  price: "",
  period: "month",
  area: "",
  beds: "",
  baths: "",
  descriptionEn: "",
  descriptionRu: "",
  featuresEn: "",
  featuresRu: "",
  amenities: [],
  photos: [],
};
export function Wizard() {
  const s = useApp(),
    navigate = useNavigate(),
    [params] = useSearchParams(),
    edit = params.get("edit"),
    existing = s.own.find((p) => p.id === edit),
    [step, setStep] = useState(0),
    [draft, setDraft] = useState<Draft>(blank),
    [dirty, setDirty] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [finished, setFinished] = useState(false);
  const allowNavigation = useRef(false);
  const blocker = useBlocker(
    () => dirty && !finished && !allowNavigation.current,
  );
  useEffect(() => {
    if (existing) {
      setDraft({
        name: existing.name,
        deal: existing.deal,
        type: existing.type,
        city: existing.city,
        price: String(existing.price),
        period: existing.period || "month",
        area: String(existing.area),
        beds: String(existing.beds),
        baths: String(existing.baths),
        descriptionEn: existing.description.en,
        descriptionRu: existing.description.ru,
        featuresEn: existing.features.en,
        featuresRu: existing.features.ru,
        amenities: existing.amenities,
        photos: existing.photos,
      });
    }
  }, [existing?.id]);
  useEffect(() => {
    const fn = (e: BeforeUnloadEvent) => {
      if (dirty && !finished) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", fn);
    return () => window.removeEventListener("beforeunload", fn);
  }, [dirty, finished]);
  const change = <K extends keyof Draft>(k: K, v: Draft[K]) => {
    setDraft((a) => ({ ...a, [k]: v }));
    setDirty(true);
  };
  const upload = async (files: FileList | File[]) => {
    setError("");
    const list = Array.from(files);
    if (draft.photos.length + list.length > 10) {
      setError(
        s.t(
          "Use at most 10 images.",
          "Можно загрузить не более 10 изображений.",
        ),
      );
      return;
    }
    setBusy(true);
    try {
      const photos = await Promise.all(
        list.map(async (file) => ({ src: await compressPhoto(file) })),
      );
      change("photos", [...draft.photos, ...photos]);
    } catch (e) {
      setError(
        (e as Error).message === "size"
          ? s.t(
              "Each source image must be 5 MB or less.",
              "Каждый исходный файл должен быть не больше 5 МБ.",
            )
          : (e as Error).message === "format"
            ? s.t(
                "Use JPEG, PNG or WebP images.",
                "Используйте JPEG, PNG или WebP.",
              )
            : s.t(
                "This image could not be opened. Try another file.",
                "Не удалось открыть изображение. Попробуйте другой файл.",
              ),
      );
    } finally {
      setBusy(false);
    }
  };
  const valid = () =>
    draft.name.trim().length >= 3 &&
    Number(draft.price) > 0 &&
    Number(draft.area) > 0 &&
    Number(draft.beds) >= 0 &&
    Number(draft.baths) >= 0 &&
    draft.descriptionEn.trim().length >= 20 &&
    draft.descriptionRu.trim().length >= 20 &&
    draft.photos.length > 0 &&
    draft.photos.length <= 10;
  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (step === 2 && !draft.photos.length) {
      setError(
        s.t("Add at least one image.", "Добавьте хотя бы одно изображение."),
      );
      return;
    }
    if (step < 3) {
      setStep(step + 1);
      return;
    }
    if (!valid()) {
      setError(
        s.t(
          "Please check required fields in the previous steps.",
          "Проверьте обязательные поля на предыдущих шагах.",
        ),
      );
      return;
    }
    setBusy(true);
    const c = cities.find((c) => c.name === draft.city)!;
    const id = existing?.id || crypto.randomUUID();
    const p: Property = {
      id,
      slug: existing?.slug || `home-${id}`,
      name: draft.name.trim(),
      deal: draft.deal,
      type: draft.type,
      city: draft.city,
      country: c.country,
      district: c.district,
      lat: c.lat,
      lng: c.lng,
      price: Number(draft.price),
      period: draft.period,
      area: Number(draft.area),
      beds: Number(draft.beds),
      baths: Number(draft.baths),
      description: {
        en: draft.descriptionEn.trim(),
        ru: draft.descriptionRu.trim(),
      },
      features: {
        en: draft.featuresEn.trim() || "—",
        ru: draft.featuresRu.trim() || "—",
      },
      amenities: draft.amenities,
      photos: draft.photos,
      added: existing?.added || new Date().toISOString().slice(0, 10),
      popularity: 0,
      user: true,
    };
    try {
      await s.upsert(p);
      allowNavigation.current = true;
      setFinished(true);
      setDirty(false);
      s.notify(
        s.t(
          "Saved locally in this browser.",
          "Сохранено локально в этом браузере.",
        ),
      );
      setTimeout(() => navigate(`/properties/${p.slug}`), 0);
    } catch {
      setError(
        s.t(
          "Local storage could not save this listing. Free browser storage or try smaller images, then retry.",
          "Не удалось сохранить объявление. Освободите хранилище браузера или уменьшите фотографии и повторите попытку.",
        ),
      );
    } finally {
      setBusy(false);
    }
  }
  if (!s.session)
    return (
      <section className="section page-section account-intro">
        <Building2 size={42} />
        <h1>
          {s.t(
            "Share an extraordinary place.",
            "Поделитесь исключительным местом.",
          )}
        </h1>
        <p>
          {s.t(
            "A demo session is required to publish a browser-local property.",
            "Для размещения локального объявления требуется демосессия.",
          )}
        </p>
        <Button onClick={() => s.setLoginOpen(true)}>
          {s.t("Start demo session", "Начать демосессию")}
          <ArrowRight size={18} />
        </Button>
      </section>
    );
  if (edit && s.loaded && !existing)
    return (
      <section className="section page-section">
        <Empty
          title={s.t("Listing not found.", "Объявление не найдено.")}
          text={s.t(
            "Only your own browser-local properties can be edited.",
            "Можно редактировать только собственные объявления из этого браузера.",
          )}
        />
      </section>
    );
  const steps = [
    s.t("The essentials", "Основное"),
    s.t("The details", "Характеристики"),
    s.t("The perspective", "Фотографии"),
    s.t("The final look", "Проверка"),
  ];
  return (
    <section className="section page-section wizard">
      <div className="section-heading">
        <div>
          <h1>
            {edit
              ? s.t("Refine your listing.", "Редактирование объекта.")
              : s.t("Make room for your home.", "Место для вашего дома.")}
          </h1>
          <p>
            {s.t(
              "A local demonstration. Your listing is visible only in this browser.",
              "Локальная демонстрация. Объявление доступно только в этом браузере.",
            )}
          </p>
        </div>
        <span className="step-count">0{step + 1} / 04</span>
      </div>
      <ol className="wizard-steps">
        {steps.map((a, i) => (
          <li
            className={step === i ? "active" : step > i ? "done" : ""}
            key={a}
          >
            <span>{step > i ? <Check size={16} /> : i + 1}</span>
            {a}
          </li>
        ))}
      </ol>
      <form className="form wizard-form" onSubmit={submit}>
        <h2>{steps[step]}</h2>
        {step === 0 && (
          <>
            <label>
              {s.t("Property name", "Название объекта")}
              <input
                value={draft.name}
                onChange={(e) => change("name", e.target.value)}
                required
                minLength={3}
                maxLength={100}
              />
            </label>
            <div className="field-row">
              <label>
                {s.t("Transaction", "Сделка")}
                <select
                  value={draft.deal}
                  onChange={(e) => change("deal", e.target.value as Deal)}
                >
                  <option value="buy">{s.label("buy")}</option>
                  <option value="rent">{s.label("rent")}</option>
                </select>
              </label>
              <label>
                {s.t("Property type", "Тип объекта")}
                <select
                  value={draft.type}
                  onChange={(e) => change("type", e.target.value as Kind)}
                >
                  {kinds.map((k) => (
                    <option value={k} key={k}>
                      {s.label(k)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="field-row">
              <label>
                {s.t("City", "Город")}
                <select
                  value={draft.city}
                  onChange={(e) => change("city", e.target.value as City)}
                >
                  {cities.map((c) => (
                    <option key={c.name} value={c.name}>
                      {s.settings.lang === "ru" ? c.ru : c.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                {s.t("Price (USD)", "Цена (USD)")}
                <input
                  type="number"
                  min="1"
                  max="1000000000"
                  step="1"
                  required
                  value={draft.price}
                  onChange={(e) => change("price", e.target.value)}
                />
              </label>
              {draft.deal === "rent" && (
                <label>
                  {s.t("Rental period", "Период аренды")}
                  <select
                    value={draft.period}
                    onChange={(e) =>
                      change("period", e.target.value as "month" | "week")
                    }
                  >
                    <option value="month">
                      {s.t("Per month", "За месяц")}
                    </option>
                    <option value="week">{s.t("Per week", "За неделю")}</option>
                  </select>
                </label>
              )}
            </div>
            <p className="muted">
              {s.t(
                "The map uses an approximate demo point in the selected city.",
                "На карте будет использована приблизительная демонстрационная точка выбранного города.",
              )}
            </p>
          </>
        )}
        {step === 1 && (
          <>
            <div className="field-row">
              {(["area", "beds", "baths"] as const).map((k) => (
                <label key={k}>
                  {k === "area"
                    ? s.t("Area (m²)", "Площадь (м²)")
                    : k === "beds"
                      ? s.t("Bedrooms", "Спальни")
                      : s.t("Bathrooms", "Ванные")}
                  <input
                    type="number"
                    min={k === "area" ? 1 : 0}
                    max={k === "area" ? 100000 : 100}
                    step="1"
                    required
                    value={draft[k]}
                    onChange={(e) => change(k, e.target.value)}
                  />
                </label>
              ))}
            </div>
            <label>
              {s.t("Description in English", "Описание на английском")}
              <textarea
                lang="en"
                required
                minLength={20}
                maxLength={5000}
                value={draft.descriptionEn}
                onChange={(e) => change("descriptionEn", e.target.value)}
              />
            </label>
            <label>
              {s.t("Description in Russian", "Описание на русском")}
              <textarea
                lang="ru"
                required
                minLength={20}
                maxLength={5000}
                value={draft.descriptionRu}
                onChange={(e) => change("descriptionRu", e.target.value)}
              />
            </label>
            <div className="field-row">
              <label>
                {s.t(
                  "Architectural details in English",
                  "Особенности на английском",
                )}
                <textarea
                  value={draft.featuresEn}
                  maxLength={1000}
                  onChange={(e) => change("featuresEn", e.target.value)}
                />
              </label>
              <label>
                {s.t(
                  "Architectural details in Russian",
                  "Особенности на русском",
                )}
                <textarea
                  value={draft.featuresRu}
                  maxLength={1000}
                  onChange={(e) => change("featuresRu", e.target.value)}
                />
              </label>
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
                        change(
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
          </>
        )}
        {step === 2 && (
          <>
            <label
              className="upload-zone"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (!busy) void upload(e.dataTransfer.files);
              }}
            >
              <Upload size={34} />
              <strong>
                {s.t(
                  "Drop photos here, or choose files",
                  "Перетащите фото или выберите файлы",
                )}
              </strong>
              <span>
                {s.t(
                  "JPEG, PNG, WebP · 5 MB per image · up to 10 images",
                  "JPEG, PNG, WebP · до 5 МБ на файл · до 10 изображений",
                )}
              </span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                disabled={busy}
                onChange={(e) => {
                  if (e.target.files) void upload(e.target.files);
                  e.target.value = "";
                }}
              />
            </label>
            {busy && (
              <p role="status">
                {s.t("Optimizing images…", "Оптимизируем изображения…")}
              </p>
            )}
            <div className="upload-grid">
              {draft.photos.map((photo, i) => (
                <div key={i}>
                  <PhotoView
                    photo={photo}
                    alt={`${s.t("Uploaded photo", "Загруженное фото")} ${i + 1}`}
                  />
                  <div>
                    <button
                      className="text-button"
                      type="button"
                      onClick={() =>
                        change("photos", [
                          photo,
                          ...draft.photos.filter((_, n) => n !== i),
                        ])
                      }
                    >
                      {i === 0 ? (
                        <>
                          <Check size={14} />
                          {s.t("Cover", "Обложка")}
                        </>
                      ) : (
                        s.t("Set as cover", "На обложку")
                      )}
                    </button>
                    <button
                      type="button"
                      className="icon-button"
                      onClick={() =>
                        change(
                          "photos",
                          draft.photos.filter((_, n) => n !== i),
                        )
                      }
                      aria-label={s.t("Remove photo", "Удалить фото")}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
        {step === 3 && (
          <div className="listing-review">
            {draft.photos[0] && (
              <PhotoView photo={draft.photos[0]} alt={draft.name} />
            )}
            <h3>{draft.name}</h3>
            <p>
              {s.label(draft.type)} ·{" "}
              {s.settings.lang === "ru"
                ? cities.find((c) => c.name === draft.city)?.ru
                : draft.city}{" "}
              · {s.label(draft.deal)}
            </p>
            <strong>
              {s.money(Number(draft.price))}
              {draft.deal === "rent"
                ? s.t(
                    draft.period === "week" ? " / week" : " / month",
                    draft.period === "week" ? " / нед." : " / мес.",
                  )
                : ""}
            </strong>
            <p>
              {draft.area} {s.t("m²", "м²")} · {draft.beds}{" "}
              {s.t("bedrooms", "спален")} · {draft.baths}{" "}
              {s.t("bathrooms", "ванных")}
            </p>
            <p>
              {s.settings.lang === "en"
                ? draft.descriptionEn
                : draft.descriptionRu}
            </p>
            <p>
              {draft.photos.length} {s.t("images", "изображений")}
            </p>
            <label className="check">
              <input type="checkbox" required />
              {s.t(
                "I have rights to these images and understand this listing is stored locally only.",
                "У меня есть права на изображения. Я понимаю, что объявление хранится только локально.",
              )}
            </label>
          </div>
        )}
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="wizard-actions">
          {step > 0 ? (
            <Button
              secondary
              onClick={() => {
                setStep(step - 1);
                setError("");
              }}
            >
              <ArrowLeft size={17} />
              {s.t("Back", "Назад")}
            </Button>
          ) : (
            <Link className="text-link" to="/account">
              {s.t("Cancel", "Отмена")}
            </Link>
          )}
          <Button type="submit" disabled={busy}>
            {busy
              ? s.t("Please wait…", "Подождите…")
              : step === 3
                ? edit
                  ? s.t("Save changes", "Сохранить изменения")
                  : s.t("Publish locally", "Опубликовать локально")
                : s.t("Continue", "Продолжить")}
            <ArrowRight size={17} />
          </Button>
        </div>
      </form>
      {blocker.state === "blocked" && (
        <Modal
          title={s.t("Leave this listing?", "Покинуть редактор?")}
          onClose={() => blocker.reset()}
        >
          <p>
            {s.t(
              "Your unsaved changes will be lost.",
              "Несохранённые изменения будут потеряны.",
            )}
          </p>
          <div className="field-row">
            <Button secondary onClick={() => blocker.reset()}>
              {s.t("Keep editing", "Продолжить редактирование")}
            </Button>
            <Button onClick={() => blocker.proceed()}>
              {s.t("Leave without saving", "Выйти без сохранения")}
            </Button>
          </div>
        </Modal>
      )}
    </section>
  );
}
