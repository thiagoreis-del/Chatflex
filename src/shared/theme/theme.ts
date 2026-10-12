import { createStore, useStore } from "@/shared/hooks/create-store";

export type ThemePreference = "light" | "dark" | "system";
const KEY = "ui-theme"; // preferência visual (não sensível)

export const themeStore = createStore<ThemePreference>("system");

function apply(pref: ThemePreference) {
  const dark =
    pref === "dark" ||
    (pref === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
  document.documentElement.style.colorScheme = dark ? "dark" : "light";
}

/** Chamar em useEffect no layout raiz. */
export function initTheme() {
  const stored = window.localStorage.getItem(KEY);
  const pref: ThemePreference =
    stored === "light" || stored === "dark" || stored === "system" ? stored : "system";
  themeStore.set(pref);
  apply(pref);
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  const onChange = () => themeStore.get() === "system" && apply("system");
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

export function setTheme(pref: ThemePreference) {
  window.localStorage.setItem(KEY, pref);
  themeStore.set(pref);
  apply(pref);
}

export function useTheme() {
  return useStore(themeStore);
}

/** Script inline para evitar flash de tema antes da hidratação. */
export const themeBootScript = `(function(){try{var p=localStorage.getItem('${KEY}')||'system';var d=p==='dark'||(p==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);if(d)document.documentElement.classList.add('dark');}catch(e){}})();`;
