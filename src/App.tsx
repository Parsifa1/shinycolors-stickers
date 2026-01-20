import { useEffect } from "react";
import { useShallow } from "zustand/shallow";
import SSFangTangTi from "./fonts/ShangShouFangTangTi.woff2";
import YurukaStd from "./fonts/YurukaStd.woff2";
import YouWangFangYuanTi from "./fonts/攸望方圆体-中.woff2";
import "./style/App.css";
import ColorPicker from "@uiw/react-color-chrome";
import characters from "./characters.json";
import Display from "./components/Display";
import Picker from "./components/Picker";
import Ranges from "./components/Range";
import useCanvasStore from "./stores/useCanvasStore";
import useSettingsStore from "./stores/useSettingsStore";
import useUIStore from "./stores/useUIStore";
import type { Language, SettingsStore } from "./types";
import getConfiguration from "./utils/config";
import log from "./utils/log";
import { preloadFont } from "./utils/preload";

const { ClipboardItem } = window;

const fontList = [
  { name: "YurukaStd", path: YurukaStd },
  { name: "SSFangTangTi", path: SSFangTangTi },
  { name: "YouWangFangYuanTi", path: YouWangFangYuanTi },
];

export default function App() {
  const {
    lang,
    setLang,
    fontsLoaded,
    setFontsLoaded,
    showCopySnackbar,
    setShowCopySnackbar,
    setConfig,
    incrementConfigTotal,
    t,
  } = useUIStore();

  const {
    character,
    loadedImage,
    customImageSrc,
    seed,
    setLoadedImage,
    setCustomImageSrc,
    clearCustomImage,
    setSeed,
    generateNewSeed,
  } = useCanvasStore();

  const settings = useSettingsStore(
    useShallow((state: SettingsStore) => ({
      text: state.text,
      font: state.font,
      curve: state.curve,
      curveFactor: state.curveFactor,
      wobbly: state.wobbly,
      wobblyScale: state.wobblyScale,
      wobblyRotation: state.wobblyRotation,
      fillColor: state.fillColor,
      strokeColor: state.strokeColor,
      outstrokeColor: state.outstrokeColor,
    })),
  );

  const { updateSetting, applyCharacterDefaults } = useSettingsStore();

  const handleLangChange = (_: unknown, newLang: Language) => {
    if (newLang !== null) {
      setLang(newLang);
    }
  };

  useEffect(() => {
    getConfiguration().then(setConfig).catch(console.error);
    const controller = new AbortController();

    const loadFonts = async () => {
      const criticalFonts = fontList.slice(0, 2);
      const optionalFonts = fontList.slice(2);

      const criticalPromises = criticalFonts.map((f) =>
        preloadFont(f.name, f.path, controller.signal).catch((err) => {
          if (err.name === "AbortError") {
            throw err;
          }
          console.error(`Failed to load critical font ${f.name}`, err);
        })
      );

      optionalFonts.forEach((f) => {
        preloadFont(f.name, f.path, controller.signal).catch((err) => {
          if (err.name !== "AbortError") {
            console.error(`Failed to load optional font ${f.name}`, err);
          }
        });
      });

      try {
        await Promise.all(criticalPromises);
        console.log("Critical fonts loaded! UI Unlocked.");
        setFontsLoaded(true);
      } catch (err) {
        if (err instanceof Error && err.name !== "AbortError") {
          console.error("Font loading error:", err);
        }
      }
    };

    loadFonts();
    return () => controller.abort();
  }, [setConfig, setFontsLoaded]);

  useEffect(() => {
    const charData = characters[character];
    applyCharacterDefaults(charData);
    clearCustomImage();
  }, [character, applyCharacterDefaults, clearCustomImage]);

  useEffect(() => {
    const img = new Image();
    const src = customImageSrc || "img/" + characters[character].img;
    img.src = src;
    img.crossOrigin = "Anonymous";

    img.onload = () => {
      setLoadedImage(img);
    };

    return () => {
      img.onload = null;
    };
  }, [character, customImageSrc, setLoadedImage]);

  const handleSeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val)) {
      setSeed(val);
    } else if (e.target.value === "") {
      setSeed(0);
    }
  };

  const download = async () => {
    const canvas = document.getElementsByTagName("canvas")[0];
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `${characters[character].name}_stickers.png`;
    link.href = canvas.toDataURL();
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    await log(characters[character].id, characters[character].name, "download");
    incrementConfigTotal();
  };

  function b64toBlob(b64Data: string, contentType = "image/png", sliceSize = 512): Blob {
    const byteCharacters = atob(b64Data);
    const byteArrays = [];
    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      const slice = byteCharacters.slice(offset, offset + sliceSize);
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      byteArrays.push(new Uint8Array(byteNumbers));
    }
    return new Blob(byteArrays, { type: contentType });
  }

  const copy = async () => {
    const canvas = document.getElementsByTagName("canvas")[0];
    if (!canvas) return;
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          "image/png": b64toBlob(canvas.toDataURL().split(",")[1]),
        }),
      ]);
      setShowCopySnackbar(true);
      setTimeout(() => setShowCopySnackbar(false), 2000);
      await log(characters[character].id, characters[character].name, "copy");
      incrementConfigTotal();
    } catch (err) {
      console.error("Copy failed", err);
      alert(t("copy_failed"));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result;
        if (typeof result === "string") {
          setCustomImageSrc(result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="App">
      <div className="language-bar">
        <span className="text-sm text-gray-600">{t("language")}:</span>
        <div className="join">
          {(
            [
              { label: "中", value: "zh" as Language },
              { label: "日", value: "ja" as Language },
              { label: "En", value: "en" as Language },
            ] as const
          ).map(({ label, value }) => (
            <input
              key={value}
              className="lang-option"
              type="radio"
              name="options"
              aria-label={label}
              checked={lang === value}
              onChange={() => handleLangChange(null, value)}
            />
          ))}
        </div>
      </div>
      <div className="container">
        <Display
          loadedImage={loadedImage}
          fontsLoaded={fontsLoaded}
        />
        <div className="w-full max-w-150 flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row gap-4 w-full">
            <div className="grow">
              <textarea
                className="textarea textarea-secondary w-full"
                placeholder={t("text")}
                value={settings.text}
                onChange={(e) => updateSetting("text", e.target.value)}
                rows={2}
              >
              </textarea>
            </div>
            <div className="form-control w-full sm:w-auto min-w-40">
              <label className="label">
                <span className="label-text font-bold">{t("font")}</span>
              </label>
              <select
                className="select select-secondary w-full"
                value={settings.font}
                onChange={(e) => updateSetting("font", e.target.value)}
              >
                {fontList.map((f) => (
                  <option key={f.name} value={f.name}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex flex-col gap-6 w-full">
            <Ranges />
            <div className="flex flex-col sm:flex-row gap-4 w-full my-2">
              <div className="flex-1 border border-base-200 rounded-lg p-3 flex flex-col gap-2 bg-base-100">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-sm">{t("curve")}</span>
                  <input
                    type="checkbox"
                    className="toggle toggle-secondary toggle-sm"
                    checked={settings.curve}
                    onChange={(e) => updateSetting("curve", e.target.checked)}
                  />
                </div>
                {settings.curve && (
                  <div>
                    <label className="label py-1">
                      <span className="label-text">
                        {t("curve_factor")}: {settings.curveFactor}
                      </span>
                    </label>
                    <input
                      type="range"
                      min={3}
                      max={10}
                      step={0.1}
                      value={settings.curveFactor}
                      onChange={(e) => updateSetting("curveFactor", Number(e.target.value))}
                      className="setting-range"
                    />
                  </div>
                )}
              </div>

              <div className="flex-1 border border-base-200 rounded-lg p-3 flex flex-col gap-2 bg-base-100">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-sm">{t("wobbly")}</span>
                  <div className="flex items-center gap-1">
                    {settings.wobbly && (
                      <div className="flex gap-1">
                        <input
                          type="text"
                          className="range w-35 border rounded-box px-1 text-center text-sm"
                          value={seed}
                          onChange={handleSeedChange}
                        />
                        <button className="btn btn-ghost btn-xs px-1" onClick={generateNewSeed} title={t("new_seed")}>
                          🎲
                        </button>
                      </div>
                    )}
                    <input
                      type="checkbox"
                      className="toggle toggle-secondary toggle-sm"
                      checked={settings.wobbly}
                      onChange={(e) => updateSetting("wobbly", e.target.checked)}
                    />
                  </div>
                </div>
                {settings.wobbly && (
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="label py-1">
                        <span className="label-text">{t("scale_chaos")}</span>
                      </label>
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.01}
                        value={settings.wobblyScale}
                        onChange={(e) => updateSetting("wobblyScale", Number(e.target.value))}
                        className="setting-range"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="label py-1">
                        <span className="label-text">{t("rotate_chaos")}</span>
                      </label>
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.01}
                        value={settings.wobblyRotation}
                        onChange={(e) =>
                          updateSetting(
                            "wobblyRotation",
                            Number(e.target.value),
                          )}
                        className="setting-range"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-row justify-center gap-8">
              {(
                [
                  { label: "fill_color" as const, option: "fillColor" as const },
                  { label: "inner_stroke_color" as const, option: "strokeColor" as const },
                  { label: "outer_stroke_color" as const, option: "outstrokeColor" as const },
                ] as const
              ).map(({ label, option }) => (
                <div key={option} className="flex flex-col items-center gap-2">
                  <label className="text-sm font-bold">{t(label)}:</label>
                  <ColorPicker
                    color={settings[option]}
                    style={{
                      background: "var(--color-base-100)",
                      border: "var(--color-base-200)",
                    }}
                    onChange={(color) => updateSetting(option, color.hexa)}
                  />
                </div>
              ))}
            </div>
          </div>
          <div className="w-full flex flex-col items-center gap-4 p-6 bg-base-200 rounded-box shadow-sm">
            <div className="w-full flex justify-center">
              <Picker />
            </div>
            <div className="flex flex-wrap justify-center gap-2 items-center w-full mt-4">
              <input type="file" accept="image/*" onChange={handleImageUpload} id="image-upload" className="hidden" />
              <label htmlFor="image-upload">
                <span className="btn btn-outline btn-secondary btn-sm">{t("upload_your_image")}</span>
              </label>
              {customImageSrc && (
                <button className="btn btn-warning btn-sm ml-2" onClick={clearCustomImage}>
                  {t("reset_to_original")}
                </button>
              )}
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-4 mt-4">
            <button className="btn btn-secondary" onClick={copy}>{t("copy")}</button>
            <button className="btn btn-secondary" onClick={download}>{t("download")}</button>
          </div>
        </div>
      </div>
      {showCopySnackbar && (
        <div className="toast toast-center toast-bottom z-50">
          <div className="alert alert-success text-white">
            <span>{t("copied_to_clipboard")}</span>
          </div>
        </div>
      )}
    </div>
  );
}
