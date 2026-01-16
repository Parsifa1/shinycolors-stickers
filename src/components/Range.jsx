import { useShallow } from "zustand/shallow";
import useSettingsStore from "../stores/useSettingsStore";
import useUIStore from "../stores/useUIStore";

function Range({ min, max, option, name }) {
  const t = useUIStore((state) => state.t);
  const value = useSettingsStore((state) => state[option]);
  const updateSetting = useSettingsStore((state) => state.updateSetting);

  return (
    <div className="flex-1 w-full">
      <label className="label">
        <span className="label-text font-bold">
          {t(name)}: {value}
        </span>
      </label>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => updateSetting(option, Number(e.target.value))}
        className="setting-range"
      />
    </div>
  );
}

const rangelist = [
  { option: "colorStrokeSize", name: "inner_stroke", min: 0, max: 25 },
  { option: "whiteStrokeSize", name: "outer_stroke", min: 0, max: 35 },
  { option: "r", name: "rotate", min: -16, max: 16 },
  { option: "s", name: "font_size", min: 5, max: 100 },
  { option: "lineSpacing", name: "line_spacing", min: 0, max: 100 },
  { option: "ls", name: "letter_spacing", min: -20, max: 50 },
];

export default function Ranges() {
  return rangelist.map(({ option, name, min, max }, index) => {
    if (index % 2 !== 0) return null;
    const { option: opt, name: na, min: mi, max: ma } = rangelist[index + 1];
    return (
      <div key={option} className="flex flex-col sm:flex-row items-center gap-4 w-full">
        <Range min={min} max={max} option={option} name={name} />
        <Range min={mi} max={ma} option={opt} name={na} />
      </div>
    );
  });
}
