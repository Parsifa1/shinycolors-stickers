import { useState, useMemo, useRef, useEffect } from "react";
import characters from "../characters.json";

export default function Picker({ setCharacter }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
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
    return characters.map((c, index) => {
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
            className="cursor-pointer hover:opacity-50 active:opacity-80 transition-opacity rounded-lg overflow-hidden border border-base-200"
          >
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
    }).filter(Boolean); // Filter out nulls
  }, [search, setCharacter]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        className="btn btn-secondary"
        onClick={() => setIsOpen(!isOpen)}
      >
        Pick character
      </button>

      {isOpen && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 bg-base-100 rounded-box shadow-xl border border-base-200 w-[90vw] max-w-[500px] overflow-hidden">
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
          
          <div className="p-4 h-[450px] overflow-y-auto">
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
