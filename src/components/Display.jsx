import Canvas from "./Canvas";
import { useRef, useCallback, useDeferredValue } from "react";
import { useShallow } from "zustand/shallow";
import { CONSTANTS } from "../utils/constants";
import useSettingsStore from "../stores/useSettingsStore";
import useCanvasStore from "../stores/useCanvasStore";
import useUIStore from "../stores/useUIStore";

export default function Display({ loadedImage, fontsLoaded }) {
  const t = useUIStore((state) => state.t);
  const seed = useCanvasStore((state) => state.seed);

  const settings = useSettingsStore(
    useShallow((state) => ({
      text: state.text,
      x: state.x,
      y: state.y,
      s: state.s,
      ls: state.ls,
      r: state.r,
      lineSpacing: state.lineSpacing,
      fillColor: state.fillColor,
      strokeColor: state.strokeColor,
      outstrokeColor: state.outstrokeColor,
      colorStrokeSize: state.colorStrokeSize,
      whiteStrokeSize: state.whiteStrokeSize,
      vertical: state.vertical,
      textOnTop: state.textOnTop,
      font: state.font,
      curve: state.curve,
      curveFactor: state.curveFactor,
      wobbly: state.wobbly,
      wobblyScale: state.wobblyScale,
      wobblyRotation: state.wobblyRotation,
    })),
  );

  const { updateSetting, updatePosition } = useSettingsStore();

  const deferredSettings = useDeferredValue(settings);
  const deferredSeed = useDeferredValue(seed);
  const isDragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const isReady = loadedImage && fontsLoaded;

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

    updatePosition(dx, dy);

    lastPos.current = { x: clientX, y: clientY };
  };

  const handlePointerUp = () => {
    isDragging.current = false;
  };

  const draw = useCallback(
    async (ctx) => {
      if (!loadedImage) return;

      const currentSettings = deferredSettings;
      const currentSeed = deferredSeed;

      await document.fonts.load(`${currentSettings.s}px ${currentSettings.font}`);

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

  return (
    <div className="flex flex-col justify-center items-center gap-4 bg-base-200 p-6 rounded-box shadow-md">
      <div className="flex flex-row justify-center gap-4 w-full">
        <div className="flex flex-col items-center gap-2">
          <div
            className="canvas-wrapper"
            style={{ cursor: isDragging.current ? "grabbing" : "grab" }}
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
            onChange={(e) => updateSetting("x", Number(e.target.value))}
            className="setting-range"
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
                updateSetting(
                  "y",

                  settings.curve && !settings.vertical ?
                    256 + settings.s * 3 - Number(e.target.value)
                  : 256 - Number(e.target.value),
                )
              }
              className="range range-sm w-60 -rotate-90"
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
                onChange={(e) => updateSetting("vertical", e.target.checked)}
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
                onChange={(e) => updateSetting("textOnTop", e.target.checked)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
