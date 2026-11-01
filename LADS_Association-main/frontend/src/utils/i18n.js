export const EMPTY_ML = {
  en: "",
  fr: "",
  ar: "",
};

export function ml(value) {

  if (!value || typeof value !== "object") {
    return { ...EMPTY_ML };
  }

  return {
    en: value.en || "",
    fr: value.fr || "",
    ar: value.ar || "",
  };
}

export function mlDisplay(
  value,
  lang = "en",
  fallback = "—"
) {

  if (!value) return fallback;

  return (

    value[lang]

    ||

    value.en

    ||

    value.fr

    ||

    value.ar

    ||

    fallback
  );
}

export function hasAnyMl(value) {

  if (!value) return false;

  return !!(
    value.en?.trim() ||
    value.fr?.trim() ||
    value.ar?.trim()
  );
}