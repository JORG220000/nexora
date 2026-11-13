import { useEffect, useState } from "react";
import { useApp } from "./state";
export function Intro() {
  const s = useApp();
  const [visible, setVisible] = useState(() => {
    try {
      return !sessionStorage.getItem("nexora.intro");
    } catch {
      return true;
    }
  });
  useEffect(() => {
    let live = true;
    document.fonts.ready.then(() => {
      try {
        sessionStorage.setItem("nexora.intro", "1");
      } catch {}
      if (live) setVisible(false);
    });
    return () => {
      live = false;
    };
  }, []);
  return visible ? (
    <div
      className="intro"
      role="status"
      aria-label={s.t("Loading NEXORA", "Загрузка NEXORA")}
    >
      <span>NEXORA</span>
      <div className="intro-line" />
    </div>
  ) : null;
}
export function Enhancements() {
  const s = useApp();
  useEffect(() => {
    const invalid = (e: Event) => {
      const el = e.target as
        | HTMLInputElement
        | HTMLTextAreaElement
        | HTMLSelectElement;
      if (!el.validity) return;
      let text = "";
      if (el.validity.valueMissing)
        text = s.t(
          "Complete this required field.",
          "Заполните обязательное поле.",
        );
      else if (el.validity.typeMismatch)
        text = s.t(
          "Enter a valid email address.",
          "Введите корректный адрес email.",
        );
      else if (el.validity.tooShort)
        text = s.t(
          `Use at least ${(el as HTMLInputElement).minLength} characters.`,
          `Введите не менее ${(el as HTMLInputElement).minLength} символов.`,
        );
      else if (el.validity.rangeUnderflow || el.validity.rangeOverflow)
        text = s.t(
          `Use a value from ${(el as HTMLInputElement).min} to ${(el as HTMLInputElement).max || "the maximum"}.`,
          `Укажите значение от ${(el as HTMLInputElement).min} до ${(el as HTMLInputElement).max || "максимума"}.`,
        );
      else if (el.validity.stepMismatch)
        text = s.t(
          "Enter a value matching the allowed step.",
          "Введите значение с допустимым шагом.",
        );
      if (text) {
        el.setCustomValidity(text);
        el.setAttribute("aria-invalid", "true");
        const id = el.id || `field-${Math.random().toString(36).slice(2, 9)}`;
        el.id = id;
        let message = document.getElementById(id + "-error");
        if (!message) {
          message = document.createElement("span");
          message.id = id + "-error";
          message.className = "inline-error";
          el.parentElement?.append(message);
        }
        message.textContent = text;
        el.setAttribute("aria-describedby", message.id);
      }
    };
    const input = (e: Event) => {
      const el = e.target as HTMLInputElement;
      if (el.setCustomValidity) {
        el.setCustomValidity("");
        el.removeAttribute("aria-invalid");
        document.getElementById(el.id + "-error")?.remove();
        el.removeAttribute("aria-describedby");
      }
    };
    document.addEventListener("invalid", invalid, true);
    document.addEventListener("input", input, true);
    return () => {
      document.removeEventListener("invalid", invalid, true);
      document.removeEventListener("input", input, true);
    };
  }, [s.settings.lang]);
  useEffect(() => {
    if (s.reduced || !matchMedia("(hover:hover) and (min-width:900px)").matches)
      return;
    let frame = 0;
    const update = () => {
      frame = 0;
      document
        .querySelectorAll<HTMLElement>(".manifesto-image,.about-hero>.photo")
        .forEach((el) => {
          const rect = el.getBoundingClientRect();
          if (rect.top < innerHeight && rect.bottom > 0)
            el.style.translate = `0 ${Math.max(-18, Math.min(18, (innerHeight / 2 - rect.top - rect.height / 2) * 0.04))}px`;
        });
    };
    const scroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const move = (e: PointerEvent) => {
      const el = (e.target as Element).closest<HTMLElement>(
        ".hero-search .button,.detail-cta .button",
      );
      if (el) {
        const r = el.getBoundingClientRect();
        el.style.translate = `${(e.clientX - r.left - r.width / 2) * 0.07}px ${(e.clientY - r.top - r.height / 2) * 0.08}px`;
      }
    };
    const leave = (e: PointerEvent) => {
      const el = (e.target as Element).closest<HTMLElement>(".button");
      if (el) el.style.translate = "0 0";
    };
    window.addEventListener("scroll", scroll, { passive: true });
    document.addEventListener("pointermove", move);
    document.addEventListener("pointerout", leave);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", scroll);
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerout", leave);
      document.querySelectorAll<HTMLElement>("[style]").forEach((el) => {
        if (el.style.translate) el.style.translate = "";
      });
    };
  }, [s.reduced]);
  return null;
}
