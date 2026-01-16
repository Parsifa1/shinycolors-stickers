export interface CharacterDefaultText {
  text: string;
  x: number;
  y: number;
  ls: number;
  r: number;
  s: number;
}

export interface Character {
  id: string;
  name: string;
  character: string;
  img: string;
  fillColor: string;
  strokeColor: string;
  outstrokeColor: string;
  vertical: boolean;
  defaultText: CharacterDefaultText;
}

export interface SettingsState {
  text: string;
  x: number;
  y: number;
  s: number;
  ls: number;
  r: number;
  lineSpacing: number;
  fillColor: string;
  strokeColor: string;
  outstrokeColor: string;
  colorStrokeSize: number;
  whiteStrokeSize: number;
  vertical: boolean;
  textOnTop: boolean;
  font: string;
  curve: boolean;
  curveFactor: number;
  wobbly: boolean;
  wobblyScale: number;
  wobblyRotation: number;
}

export interface SettingsStore extends SettingsState {
  updateSetting: <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => void;
  updateSettings: (updates: Partial<SettingsState>) => void;
  resetSettings: () => void;
  applyCharacterDefaults: (charData: Character) => void;
  updatePosition: (dx: number, dy: number) => void;
}

export interface CanvasState {
  character: number;
  loadedImage: HTMLImageElement | null;
  customImageSrc: string | null;
  seed: number;
}

export interface CanvasStore extends CanvasState {
  setCharacter: (index: number) => void;
  setLoadedImage: (img: HTMLImageElement | null) => void;
  setCustomImageSrc: (src: string | null) => void;
  clearCustomImage: () => void;
  setSeed: (seed: number) => void;
  generateNewSeed: () => void;
  getCurrentCharacter: () => Character;
}

export type Language = "zh" | "en" | "ja";

export interface Config {
  total: number;
  [key: string]: unknown;
}

export interface UIState {
  lang: Language;
  fontsLoaded: boolean;
  showCopySnackbar: boolean;
  config: Config | null;
}

export interface UIStore extends UIState {
  setLang: (lang: Language) => void;
  setFontsLoaded: (loaded: boolean) => void;
  setShowCopySnackbar: (show: boolean) => void;
  setConfig: (config: Config | null) => void;
  incrementConfigTotal: () => void;
  t: (key: string) => string;
}

export type LocaleKey = 
  | "total_stickers_made"
  | "copy"
  | "download"
  | "about"
  | "copied_to_clipboard"
  | "copy_failed"
  | "upload_your_image"
  | "reset_to_original"
  | "loading_assets"
  | "simple_mode"
  | "advanced_mode"
  | "language"
  | "text"
  | "font"
  | "inner_stroke"
  | "outer_stroke"
  | "rotate"
  | "font_size"
  | "vertical"
  | "text_on_top"
  | "line_spacing"
  | "letter_spacing"
  | "curve_effect"
  | "curve"
  | "curve_factor"
  | "wobbly_effect"
  | "wobbly"
  | "seed"
  | "new_seed"
  | "scale_chaos"
  | "rotate_chaos"
  | "fill_color"
  | "inner_stroke_color"
  | "outer_stroke_color";

export type LocaleData = Record<LocaleKey, string>;
export type Locales = Record<Language, LocaleData>;

export interface FontItem {
  name: string;
  path: string;
}

export interface CanvasProps {
  draw: (ctx: CanvasRenderingContext2D) => Promise<void> | void;
  spaceSize?: number;
}

export interface DisplayProps {
  loadedImage: HTMLImageElement | null;
  fontsLoaded: boolean;
}

export interface RangeProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
}
