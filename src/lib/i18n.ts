import type { Language } from "./types";

export interface LanguageOption {
  code: Language;
  label: string;
  /** Endonym, so speakers recognise their own language in the switcher. */
  native: string;
  dir: "ltr" | "rtl";
  /** Copy is only fully translated for `en` at launch. */
  available: boolean;
}

export const LANGUAGES: LanguageOption[] = [
  { code: "en", label: "English", native: "English", dir: "ltr", available: true },
  { code: "ar", label: "Arabic", native: "العربية", dir: "rtl", available: false },
  { code: "fr", label: "French", native: "Français", dir: "ltr", available: false },
  { code: "bn", label: "Bengali", native: "বাংলা", dir: "ltr", available: false },
];

export const DEFAULT_LANGUAGE: Language = "en";

export function languageOption(code: Language | null | undefined) {
  return LANGUAGES.find((language) => language.code === code) ?? LANGUAGES[0];
}

export function isRtl(code: Language | null | undefined) {
  return languageOption(code).dir === "rtl";
}
