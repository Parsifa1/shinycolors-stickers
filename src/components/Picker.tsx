import { useState, useMemo, useRef, useEffect } from "react";
import characters from "../characters.json";
import useCanvasStore from "../stores/useCanvasStore";
import type { CanvasStore } from "../types";
import useUIStore from "../stores/useUIStore";

export default function Picker() {
  const setCharacter = useCanvasStore(
    (state: CanvasStore) => state.setCharacter,
  );
  const t = useUIStore((state) => state.t);
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  const memoizedImageListItems = useMemo(() => {
    const s = search.toLowerCase();
    return characters
      .map((c, index) => {
        if (
          s === c.id ||
          c.name.toLowerCase().includes(s) ||
          c.character.toLowerCase().includes(s)
        ) {
          return (
            <div
              key={index}
              onClick={() => {
                setIsOpen(false);
                setCharacter(index);
              }}
              className="cursor-pointer hover:opacity-50 active:opacity-80 transition-opacity rounded-lg overflow-hidden border border-base-200">
              <img
                src={`img/${c.img}`}
                alt={c.name}
                loading="lazy"
                className="w-full h-full object-cover aspect-square"
              />
            </div>
          );
        }
        return null;
      })
      .filter(Boolean);
  }, [search, setCharacter]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button className="btn btn-secondary" onClick={() => setIsOpen(!isOpen)}>
      {t("select_character")}
      </button>

      {isOpen && (
        <div className="absolute -top-135 left-1/2 -translate-x-1/2 mt-2 z-50 bg-base-100 rounded-box shadow-xl border border-base-200 w-[90vw] max-w-125 overflow-hidden">
          <div className="p-4 bg-base-100 sticky top-0 z-10 border-b border-base-200">
            <input
              type="text"
              placeholder="Search character"
              className="input input-bordered input-secondary w-full input-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>

          <div className="p-4 h-112.5 overflow-y-auto">
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {memoizedImageListItems}
            </div>
            {memoizedImageListItems.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No characters found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
