import { useContext, createContext } from "react";

const LangContext = createContext({});

function Range({ min, max, option, name }) {
  const { t, settings, updateSetting } = useContext(LangContext);
  return (
    <div className="flex-1 w-full">
      <label className="label">
        <span className="label-text font-bold">
          {t(name)}: {settings[option]}
        </span>
      </label>
      <input
        type="range"
        min={min}
        max={max}
        value={settings[option]}
        onChange={(e) => updateSetting(option, Number(e.target.value))}
        className="setting-range"
      />
    </div>
  );
}

export default function Ranges({ t, settings, updateSetting }) {
  const rangelist = [
    { option: "colorStrokeSize", name: "inner_stroke", min: 0, max: 25 },
    { option: "whiteStrokeSize", name: "outer_stroke", min: 0, max: 35 },
    { option: "r", name: "rotate", min: -16, max: 16 },
    { option: "s", name: "font_size", min: 5, max: 100 },
    { option: "lineSpacing", name: "line_spacing", min: 0, max: 100 },
    { option: "ls", name: "letter_spacing", min: -20, max: 50 },
  ];

  return rangelist.map(({ option, name, min, max }, index) => {
    if (index % 2 !== 0) return null;
    const { option: opt, name: na, min: mi, max: ma } = rangelist[index + 1];
    return (
      <div className="flex flex-col sm:flex-row items-center gap-4 w-full ">
        <LangContext.Provider value={{ t, settings, updateSetting }}>
          <Range min={min} max={max} option={option} name={name} />
          <Range min={mi} max={ma} option={opt} name={na} />
        </LangContext.Provider>
      </div>
    );
  });
}
