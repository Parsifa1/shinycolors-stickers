import { create } from "zustand";
import type { CanvasStore } from "../types/index";
import characters from "../characters.json";

const useCanvasStore = create<CanvasStore>((set, get) => ({
  character: 18,
  loadedImage: null,
  customImageSrc: null,
  seed: Math.floor(Math.random() * 1000),

  setCharacter: (index) => set({ character: index }),

  setLoadedImage: (img) => set({ loadedImage: img }),

  setCustomImageSrc: (src) => set({ customImageSrc: src }),

  clearCustomImage: () => set({ customImageSrc: null }),

  setSeed: (seed) => set({ seed }),

  generateNewSeed: () => set({ seed: Math.floor(Math.random() * 10000) }),

  getCurrentCharacter: () => characters[get().character],
}));

export default useCanvasStore;
