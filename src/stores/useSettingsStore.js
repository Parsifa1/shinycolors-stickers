import { create } from "zustand";
import { CONSTANTS } from "../utils/constants";

const defaultSettings = {
  text: "",
  x: 0,
  y: 0,
  s: CONSTANTS.DEFAULT_FONT_SIZE,
  ls: 0,
  r: 0,
  lineSpacing: CONSTANTS.DEFAULT_LINE_SPACING,
  fillColor: "#ffffff",
  strokeColor: "#000000",
  outstrokeColor: "#ffffff",
  colorStrokeSize: 5,
  whiteStrokeSize: 10,
  vertical: false,
  textOnTop: true,
  font: "YurukaStd",
  curve: false,
  curveFactor: 6,
  wobbly: false,
  wobblyScale: 0.3,
  wobblyRotation: 0.3,
};

const useSettingsStore = create((set) => ({
  ...defaultSettings,

  updateSetting: (key, value) => set({ [key]: value }),

  updateSettings: (updates) => set(updates),

  resetSettings: () => set(defaultSettings),

  applyCharacterDefaults: (charData) => {
    const def = charData.defaultText;
    set({
      text: def.text,
      x: def.x,
      y: def.y,
      s: def.s,
      ls: def.ls,
      r: def.r,
      vertical: charData.vertical,
      fillColor: charData.fillColor,
      strokeColor: charData.strokeColor,
      outstrokeColor: charData.outstrokeColor,
    });
  },

  updatePosition: (dx, dy) =>
    set((state) => ({
      x: state.x + dx,
      y: state.y + dy,
    })),
}));

export default useSettingsStore;
