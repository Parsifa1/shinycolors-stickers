import { create } from "zustand";
import locales from "../locales";

const useUIStore = create((set, get) => ({
  lang: "zh",
  fontsLoaded: false,
  showCopySnackbar: false,
  config: null,

  setLang: (lang) => set({ lang }),

  setFontsLoaded: (loaded) => set({ fontsLoaded: loaded }),

  setShowCopySnackbar: (show) => set({ showCopySnackbar: show }),

  setConfig: (config) => set({ config }),

  incrementConfigTotal: () =>
    set((state) => ({
      config: state.config ? { ...state.config, total: state.config.total + 1 } : null,
    })),

  t: (key) => {
    const { lang } = get();
    return locales[lang][key] || key;
  },
}));

export default useUIStore;
