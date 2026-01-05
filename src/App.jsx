import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useDeferredValue,
} from "react";

import YurukaStd from "./fonts/YurukaStd.woff2";
import SSFangTangTi from "./fonts/ShangShouFangTangTi.woff2";
import YouWangFangYuanTi from "./fonts/攸望方圆体-中.woff2";

import "./App.css";
import Canvas from "./components/Canvas";
import characters from "./characters.json";
import Picker from "./components/Picker";
import Info from "./components/Info";

import ColorPicker from "@uiw/react-color-chrome";

import getConfiguration from "./utils/config";
import log from "./utils/log";
import { preloadFont } from "./utils/preload";
import locales from "./locales"; // 引入本地化文件

const { ClipboardItem } = window;

const CONSTANTS = {
  CANVAS_WIDTH: 296,
  CANVAS_HEIGHT: 256,
  DEFAULT_FONT_SIZE: 50,
  DEFAULT_LINE_SPACING: 50,
  MITER_LIMIT: 2.5,
  CURVE_OFFSET_FACTOR: 3.5,
};

const fontList = [
  { name: "YurukaStd", path: YurukaStd },
  { name: "SSFangTangTi", path: SSFangTangTi },
  { name: "YouWangFangYuanTi", path: YouWangFangYuanTi },
];

function App() {
  // --- 本地化状态 ---
  const [lang, setLang] = useState("zh"); // 默认为中文
  // 辅助函数：获取当前语言的文本
  const t = (key) => {
    return locales[lang][key] || key;
  };

  const handleLangChange = (_, newLang) => {
    if (newLang !== null) {
      setLang(newLang);
    }
  };

  // --- 全局配置与UI状态 ---
  const [config, setConfig] = useState(null);
  const [infoOpen, setInfoOpen] = useState(false);
  const [openCopySnackbar, setOpenCopySnackbar] = useState(false);
  const [fontsLoaded, setFontsLoaded] = useState(false);

  // --- 核心绘图状态 ---
  const [character, setCharacter] = useState(18);
  const [customImageSrc, setCustomImageSrc] = useState(null);
  const [loadedImage, setLoadedImage] = useState(null);

  const [seed, setSeed] = useState(Math.floor(Math.random() * 1000));

  const [settings, setSettings] = useState({
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
  });

  const deferredSettings = useDeferredValue(settings);
  const deferredSeed = useDeferredValue(seed);
  const isDragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  // --- 初始化与字体预加载 ---
  useEffect(() => {
    getConfiguration().then(setConfig).catch(console.error);
    const controller = new AbortController();

    const loadFonts = async () => {
      const criticalFonts = fontList.slice(0, 2);
      const optionalFonts = fontList.slice(2);

      const criticalPromises = criticalFonts.map((f) =>
        preloadFont(f.name, f.path, controller.signal).catch((err) =>
          console.error(`Failed to load critical font ${f.name}`, err),
        ),
      );

      optionalFonts.forEach((f) => {
        preloadFont(f.name, f.path, controller.signal).catch((err) =>
          console.error(`Failed to load optional font ${f.name}`, err),
        );
      });

      await Promise.all(criticalPromises);
      console.log("Critical fonts loaded! UI Unlocked.");
      setFontsLoaded(true);
    };

    loadFonts();
    return () => controller.abort();
  }, []);

  // --- 逻辑部分 (保持不变) ---
  useEffect(() => {
    const charData = characters[character];
    const def = charData.defaultText;

    setSettings((prev) => ({
      ...prev,
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
    }));

    setCustomImageSrc(null);
  }, [character]);

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
  }, [character, customImageSrc]);

  const updateSetting = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handlePositionChange = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const generateNewSeed = () => {
    setSeed(Math.floor(Math.random() * 10000));
  };

  const handleSeedChange = (e) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val)) {
      setSeed(val);
    } else if (e.target.value === "") {
      setSeed(0);
    }
  };

  const handlePointerDown = (e) => {
    isDragging.current = true;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    lastPos.current = { x: clientX, y: clientY };
  };

  const handlePointerMove = (e) => {
    if (!isDragging.current) return;
    if (e.cancelable && e.type === "touchmove") e.preventDefault();

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const dx = clientX - lastPos.current.x;
    const dy = clientY - lastPos.current.y;

    setSettings((prev) => ({
      ...prev,
      x: prev.x + dx,
      y: prev.y + dy,
    }));

    lastPos.current = { x: clientX, y: clientY };
  };

  const handlePointerUp = () => {
    isDragging.current = false;
  };

  const draw = useCallback(
    (ctx) => {
      if (!loadedImage) return;

      const currentSettings = deferredSettings;
      const currentSeed = deferredSeed;

      document.fonts.load(`${currentSettings.s}px ${currentSettings.font}`);

      ctx.canvas.width = CONSTANTS.CANVAS_WIDTH;
      ctx.canvas.height = CONSTANTS.CANVAS_HEIGHT;
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

      const drawImg = () => {
        const img = loadedImage;
        const hRatio = ctx.canvas.width / img.width;
        const vRatio = ctx.canvas.height / img.height;
        const ratio = Math.min(hRatio, vRatio);
        const centerShiftX = (ctx.canvas.width - img.width * ratio) / 2;
        const centerShiftY = (ctx.canvas.height - img.height * ratio) / 2;
        ctx.drawImage(
          img,
          0,
          0,
          img.width,
          img.height,
          centerShiftX,
          centerShiftY,
          img.width * ratio,
          img.height * ratio,
        );
      };

      const drawTxt = () => {
        const {
          text,
          font,
          s,
          x,
          y,
          r,
          fillColor,
          strokeColor,
          outstrokeColor,
          whiteStrokeSize,
          colorStrokeSize,
          lineSpacing,
          ls,
          vertical,
          curve,
          curveFactor,
          wobbly,
          wobblyScale,
          wobblyRotation,
        } = currentSettings;

        ctx.font = `${s}px ${font}, SSFangTangTi, YouWangFangYuanTi`;
        ctx.miterLimit = CONSTANTS.MITER_LIMIT;
        ctx.lineJoin = "round";
        ctx.lineCap = "round";

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(r / 10);
        ctx.textAlign = "center";
        ctx.fillStyle = fillColor;

        const drawStrokeAndFill = (char, dx, dy, pass) => {
          if (pass === 0) {
            ctx.strokeStyle = outstrokeColor;
            ctx.lineWidth = whiteStrokeSize;
            ctx.strokeText(char, dx, dy);
          } else {
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = colorStrokeSize;
            ctx.strokeText(char, dx, dy);
            ctx.fillText(char, dx, dy);
          }
        };

        const drawEffectiveChar = (char, dx, dy, pass, index) => {
          if (wobbly) {
            const pseudoRandom = Math.sin(currentSeed + index * 12.34);
            const scale = 1 + pseudoRandom * wobblyScale;
            const rotation = pseudoRandom * wobblyRotation;

            ctx.save();
            ctx.translate(dx, dy);
            ctx.rotate(rotation);
            ctx.scale(scale, scale);
            drawStrokeAndFill(char, 0, 0, pass);
            ctx.restore();
          } else {
            drawStrokeAndFill(char, dx, dy, pass);
          }
        };

        const lines = text.split("\n");
        let charCounter = 0;

        if (curve) {
          if (vertical) {
            for (let pass = 0; pass < 2; pass++) {
              ctx.save();
              let xOffset = 0;
              charCounter = 0;
              for (const line of lines) {
                let yOffset = 0;
                ctx.save();
                ctx.translate(xOffset, 0);
                for (let j = 0; j < line.length; j++) {
                  charCounter++;
                  const char = line[j];
                  const charAngle =
                    (Math.PI / 180) * j * ((curveFactor - 6) * 3);
                  ctx.rotate(charAngle);
                  drawEffectiveChar(char, 0, yOffset, pass, charCounter);
                  yOffset += s + ls;
                }
                ctx.restore();
                xOffset += ((lineSpacing - 50) / 50 + 1) * s;
              }
              ctx.restore();
            }
          } else {
            let currentY_H = 0;
            for (const line of lines) {
              const lineAngle = (Math.PI * line.length) / curveFactor;
              for (let pass = 0; pass < 2; pass++) {
                ctx.save();
                ctx.translate(0, currentY_H);
                let lineStartCharIndex = lines
                  .slice(0, lines.indexOf(line))
                  .join("").length;
                for (let j = 0; j < line.length; j++) {
                  const char = line[j];
                  ctx.rotate(lineAngle / line.length / (0.3 * curveFactor));
                  ctx.save();
                  ctx.translate(0, -1 * s * CONSTANTS.CURVE_OFFSET_FACTOR);
                  drawEffectiveChar(char, 0, 0, pass, lineStartCharIndex + j);
                  ctx.restore();
                }
                ctx.restore();
              }
              currentY_H += ((lineSpacing - 50) / 50 + 1) * s;
            }
          }
        } else {
          if (vertical) {
            for (let pass = 0; pass < 2; pass++) {
              let xOffset = 0;
              charCounter = 0;
              for (const line of lines) {
                let yOffset = 0;
                for (const char of line) {
                  charCounter++;
                  drawEffectiveChar(char, xOffset, yOffset, pass, charCounter);
                  yOffset += s + ls;
                }
                xOffset += ((lineSpacing - 50) / 50 + 1) * s;
              }
            }
          } else {
            for (let pass = 0; pass < 2; pass++) {
              let yOffset = 0;
              charCounter = 0;
              for (const line of lines) {
                let xOffset = 0;
                for (const char of line) {
                  charCounter++;
                  const charWidth = ctx.measureText(char).width + ls;
                  drawEffectiveChar(char, xOffset, yOffset, pass, charCounter);
                  xOffset += charWidth;
                }
                yOffset += ((lineSpacing - 50) / 50 + 1) * s;
              }
            }
          }
        }
        ctx.restore();
      };

      if (currentSettings.textOnTop) {
        drawImg();
        drawTxt();
      } else {
        drawTxt();
        drawImg();
      }
    },
    [loadedImage, deferredSettings, deferredSeed, fontsLoaded],
  );

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
    setConfig((prev) => (prev ? { ...prev, total: prev.total + 1 } : null));
  };

  function b64toBlob(b64Data, contentType = "image/png", sliceSize = 512) {
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
      setOpenCopySnackbar(true);
      await log(characters[character].id, characters[character].name, "copy");
      setConfig((prev) => (prev ? { ...prev, total: prev.total + 1 } : null));
    } catch (err) {
      console.error("Copy failed", err);
      alert(t("copy_failed"));
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCustomImageSrc(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const isReady = loadedImage && fontsLoaded;

  return (
    <div className="App">
      <Info
        open={infoOpen}
        handleClose={() => setInfoOpen(false)}
        config={config}
        lang={lang}
        t={t}
      />

      {/* 语言切换栏 */}
      <div className="absolute top-4 right-4 flex items-center gap-2 bg-base-100 p-2 rounded-lg shadow-sm z-10 opacity-90 hover:opacity-100 transition-opacity">
        <span className="text-sm text-gray-600 font-yuruka">
          {t("language")}:
        </span>
        <div className="join">
          <input
            className="join-item btn btn-sm btn-outline btn-secondary font-yuruka"
            type="radio"
            name="options"
            aria-label="中"
            checked={lang === "zh"}
            onChange={() => handleLangChange(null, "zh")}
          />
          <input
            className="join-item btn btn-sm btn-outline btn-secondary font-yuruka"
            type="radio"
            name="options"
            aria-label="日"
            checked={lang === "ja"}
            onChange={() => handleLangChange(null, "ja")}
          />
          <input
            className="join-item btn btn-sm btn-outline btn-secondary font-yuruka"
            type="radio"
            name="options"
            aria-label="En"
            checked={lang === "en"}
            onChange={() => handleLangChange(null, "en")}
          />
        </div>
      </div>

      <div className="container font-yuruka">
        <div className="flex flex-col justify-center items-center gap-4 bg-base-200 p-6 rounded-box shadow-md">
          <div className="flex flex-row justify-center gap-4 w-full">
            <div className="flex flex-col items-center gap-2">
              <div
                className="relative shadow-xl rounded-box overflow-hidden bg-base-100 border border-base-300"
                style={{
                  cursor: isDragging.current ? "grabbing" : "grab",
                }}
                onMouseDown={handlePointerDown}
                onMouseMove={handlePointerMove}
                onMouseUp={handlePointerUp}
                onMouseLeave={handlePointerUp}
                onTouchStart={handlePointerDown}
                onTouchMove={handlePointerMove}
                onTouchEnd={handlePointerUp}>
                <div className="canvas">
                  <Canvas draw={draw} spaceSize={settings.lineSpacing} />
                </div>

                {!isReady && (
                  <div className="absolute top-0 left-0 w-full h-full bg-white/80 flex flex-col items-center justify-center z-10 gap-2">
                    <span className="loading loading-spinner text-secondary"></span>
                    <span className="text-sm text-gray-600">
                      {t("loading_assets")}
                    </span>
                  </div>
                )}
              </div>
              <input
                type="range"
                min={0}
                max={296}
                value={settings.x}
                onChange={(e) =>
                  handlePositionChange("x", Number(e.target.value))
                }
                className="range range-secondary range-sm w-full"
              />
            </div>

            <div className="flex flex-row items-center">
              <div className="flex flex-col w-10 items-center">
                <input
                  type="range"
                  min={-50}
                  max={256}
                  value={
                    settings.curve && !settings.vertical ?
                      256 - settings.y + settings.s * 3
                    : 256 - settings.y
                  }
                  onChange={(e) =>
                    handlePositionChange(
                      "y",
                      settings.curve && !settings.vertical ?
                        256 + settings.s * 3 - Number(e.target.value)
                      : 256 - Number(e.target.value),
                    )
                  }
                  className="range range-secondary range-sm w-60 -rotate-90"
                />
              </div>
              <div className="flex flex-col gap-10">
                <div className="flex flex-col items-center">
                  <span className="text-xs font-bold text-gray-600 mb-1 whitespace-nowrap scale-90">
                    {t("vertical")}
                  </span>
                  <input
                    type="checkbox"
                    className="toggle toggle-secondary toggle-sm"
                    checked={settings.vertical}
                    onChange={(e) =>
                      updateSetting("vertical", e.target.checked)
                    }
                  />
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-xs font-bold text-gray-600 mb-1 whitespace-nowrap scale-90">
                    {t("text_on_top")}
                  </span>
                  <input
                    type="checkbox"
                    className="toggle toggle-secondary toggle-sm"
                    checked={settings.textOnTop}
                    onChange={(e) =>
                      updateSetting("textOnTop", e.target.checked)
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full max-w-150 flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row gap-4 w-full">
            <div className="grow">
              <textarea
                className="textarea textarea-secondary w-full"
                placeholder={t("text")}
                value={settings.text}
                onChange={(e) => updateSetting("text", e.target.value)}
                rows={2}></textarea>
            </div>

            <div className="form-control w-full sm:w-auto min-w-40">
              <label className="label">
                <span className="label-text">{t("font")}</span>
              </label>
              <select
                className="select select-secondary w-full"
                value={settings.font}
                onChange={(e) => updateSetting("font", e.target.value)}>
                {fontList.map((f) => (
                  <option key={f.name} value={f.name}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-6 w-full font-yuruka">
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
              <div className="flex-1 w-full">
                <label className="label">
                  <span className="label-text font-bold">
                    {t("inner_stroke")}: {settings.colorStrokeSize}
                  </span>
                </label>
                <input
                  type="range"
                  min={0}
                  max={25}
                  value={settings.colorStrokeSize}
                  onChange={(e) =>
                    updateSetting("colorStrokeSize", Number(e.target.value))
                  }
                  className="range range-secondary range-xs"
                />
              </div>
              <div className="flex-1 w-full">
                <label className="label">
                  <span className="label-text font-bold">
                    {t("outer_stroke")}: {settings.whiteStrokeSize}
                  </span>
                </label>
                <input
                  type="range"
                  min={0}
                  max={35}
                  value={settings.whiteStrokeSize}
                  onChange={(e) =>
                    updateSetting("whiteStrokeSize", Number(e.target.value))
                  }
                  className="range range-secondary range-xs"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
              <div className="flex-1 w-full">
                <label className="label">
                  <span className="label-text font-bold">
                    {t("rotate")}: {settings.r}
                  </span>
                </label>
                <input
                  type="range"
                  min={-16}
                  max={16}
                  step={0.1}
                  value={settings.r}
                  onChange={(e) => updateSetting("r", Number(e.target.value))}
                  className="range range-secondary range-xs"
                />
              </div>
              <div className="flex-1 w-full">
                <label className="label">
                  <span className="label-text font-bold">
                    {t("font_size")}: {settings.s}
                  </span>
                </label>
                <input
                  type="range"
                  min={5}
                  max={100}
                  value={settings.s}
                  onChange={(e) => updateSetting("s", Number(e.target.value))}
                  className="range range-secondary range-xs"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
              <div className="flex-1 w-full">
                <label className="label">
                  <span className="label-text font-bold">
                    {t("line_spacing")}: {settings.lineSpacing}
                  </span>
                </label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={settings.lineSpacing}
                  onChange={(e) =>
                    updateSetting("lineSpacing", Number(e.target.value))
                  }
                  className="range range-secondary range-xs"
                />
              </div>
              <div className="flex-1 w-full">
                <label className="label">
                  <span className="label-text font-bold">
                    {t("letter_spacing")}: {settings.ls}
                  </span>
                </label>
                <input
                  type="range"
                  min={-20}
                  max={50}
                  value={settings.ls}
                  onChange={(e) => updateSetting("ls", Number(e.target.value))}
                  className="range range-secondary range-xs"
                />
              </div>
            </div>

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
                      <span className="label-text-alt">
                        {t("curve_factor")}: {settings.curveFactor}
                      </span>
                    </label>
                    <input
                      type="range"
                      min={3}
                      max={10}
                      step={0.1}
                      value={settings.curveFactor}
                      onChange={(e) =>
                        updateSetting("curveFactor", Number(e.target.value))
                      }
                      className="range range-secondary range-xs"
                    />
                  </div>
                )}
              </div>

              <div className="flex-1 border border-base-200 rounded-lg p-3 flex flex-col gap-2 bg-base-100">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-sm">{t("wobbly")}</span>
                  <div className="flex items-center gap-0">
                    {settings.wobbly && (
                      <div className="flex gap-1">
                        <input
                          type="text"
                          className="range w-35 border rounded-box px-1 text-center text-sm"
                          value={seed}
                          onChange={handleSeedChange}
                        />
                        <button
                          className="btn btn-ghost btn-xs px-1"
                          onClick={generateNewSeed}
                          title={t("new_seed")}>
                          🎲
                        </button>
                      </div>
                    )}
                    <input
                      type="checkbox"
                      className="toggle toggle-secondary toggle-sm"
                      checked={settings.wobbly}
                      onChange={(e) =>
                        updateSetting("wobbly", e.target.checked)
                      }
                    />
                  </div>
                </div>
                {settings.wobbly && (
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="label py-1">
                        <span className="label-text-alt">
                          {t("scale_chaos")}
                        </span>
                      </label>
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.01}
                        value={settings.wobblyScale}
                        onChange={(e) =>
                          updateSetting("wobblyScale", Number(e.target.value))
                        }
                        className="range range-secondary range-xs"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="label py-1">
                        <span className="label-text-alt">
                          {t("rotate_chaos")}
                        </span>
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
                          )
                        }
                        className="range range-secondary range-xs"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-8 p-4 bg-base-200 rounded-box shadow-sm">
              <div className="flex flex-col items-center gap-2">
                <label className="text-sm font-bold">{t("fill_color")}:</label>
                <ColorPicker
                  color={settings.fillColor}
                  style={{
                    background: "var(--color-base-100)",
                    border: "var(--color-base-200)",
                  }}
                  onChange={(color) => updateSetting("fillColor", color.hexa)}
                />
              </div>
              <div className="flex flex-col items-center gap-2">
                <label className="text-sm font-bold">
                  {t("inner_stroke_color")}:
                </label>
                <ColorPicker
                  color={settings.strokeColor}
                  style={{
                    background: "var(--color-base-100)",
                    border: "var(--color-base-200)",
                  }}
                  onChange={(color) => updateSetting("strokeColor", color.hexa)}
                />
              </div>
              <div className="flex flex-col items-center gap-2">
                <label className="text-sm font-bold">
                  {t("outer_stroke_color")}:
                </label>
                <ColorPicker
                  color={settings.outstrokeColor}
                  style={{
                    background: "var(--color-base-100)",
                    border: "var(--color-base-200)",
                  }}
                  onChange={(color) =>
                    updateSetting("outstrokeColor", color.hexa)
                  }
                />
              </div>
            </div>
          </div>

          <div className="w-full flex flex-col items-center gap-4 p-6 bg-base-200 rounded-box shadow-sm">
            <div className="w-full flex justify-center">
              <Picker setCharacter={setCharacter} />
            </div>

            <div className="flex flex-wrap justify-center gap-2 items-center w-full mt-4">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                id="image-upload"
                className="hidden"
              />
              <label htmlFor="image-upload">
                <span className="btn btn-outline btn-secondary btn-sm">
                  {t("upload_your_image")}
                </span>
              </label>
              {customImageSrc && (
                <button
                  className="btn btn-warning btn-sm ml-2"
                  onClick={() => setCustomImageSrc(null)}>
                  {t("reset_to_original")}
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-4 mt-4">
            <button className="btn btn-secondary" onClick={copy}>
              {t("copy")}
            </button>
            <button className="btn btn-secondary" onClick={download}>
              {t("download")}
            </button>
          </div>
        </div>
      </div>

      {openCopySnackbar && (
        <div className="toast toast-center toast-bottom z-50">
          <div className="alert alert-success text-white">
            <span>{t("copied_to_clipboard")}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
