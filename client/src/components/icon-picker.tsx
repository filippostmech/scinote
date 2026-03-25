import { useState, useRef, useEffect } from "react";
import { SmilePlus, X, Trash2 } from "lucide-react";

const ICON_CATEGORIES: { name: string; icons: string[] }[] = [
  {
    name: "Science",
    icons: [
      "🔬", "🧬", "⚗️", "🧪", "🔭", "🧫", "🧲", "🦠", "🧮", "💊",
      "💉", "🩺", "🧯", "🔋", "🔌", "🧰", "🛠️", "📡", "🌡️", "🧊",
    ],
  },
  {
    name: "Documents",
    icons: [
      "📄", "📝", "📋", "📑", "📓", "📔", "📒", "📕", "📗", "📘",
      "📙", "📚", "📖", "🗂️", "🗃️", "🗄️", "📁", "📂", "🗒️", "🗓️",
    ],
  },
  {
    name: "Nature",
    icons: [
      "🌱", "🌿", "🍃", "🌍", "🌊", "🔥", "💧", "⚡", "❄️", "🌸",
      "🌻", "🍄", "🌲", "🦋", "🐛", "🐢", "🐠", "🦎", "🐝", "🦅",
    ],
  },
  {
    name: "Objects",
    icons: [
      "💡", "🎯", "⚙️", "🔧", "📊", "📈", "📉", "🗺️", "🧭", "⏱️",
      "⌛", "🔑", "🔒", "💎", "🏆", "🎓", "🎨", "🖊️", "✏️", "📌",
    ],
  },
  {
    name: "Symbols",
    icons: [
      "⭐", "✨", "💫", "🌟", "❤️", "🧡", "💛", "💚", "💙", "💜",
      "✅", "❌", "⚠️", "💬", "💭", "🏷️", "🔖", "📎", "🔗", "♻️",
    ],
  },
  {
    name: "Faces",
    icons: [
      "😊", "🤔", "💪", "🙌", "👀", "🧠", "🤝", "👨‍🔬", "👩‍🔬", "👨‍💻",
      "👩‍💻", "👨‍🏫", "👩‍🏫", "🤖", "👾", "🎉", "🚀", "🛰️", "🏗️", "🏛️",
    ],
  },
];

interface IconPickerProps {
  currentIcon?: string | null;
  onSelect: (icon: string | null) => void;
}

export function IconPicker({ currentIcon, onSelect }: IconPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState(0);
  const pickerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const filteredCategories = search
    ? ICON_CATEGORIES.map((cat) => ({
        ...cat,
        icons: cat.icons.filter(() => cat.name.toLowerCase().includes(search.toLowerCase())),
      })).filter((cat) => cat.icons.length > 0)
    : ICON_CATEGORIES;

  const allFilteredIcons = search
    ? ICON_CATEGORIES.flatMap((cat) => cat.icons)
    : [];

  if (currentIcon) {
    return (
      <div className="relative" ref={pickerRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-5xl mb-2 block transition-transform duration-100 hover:scale-110 cursor-pointer"
          title="Change icon"
          data-testid="button-change-icon"
        >
          {currentIcon}
        </button>
        {isOpen && (
          <PickerDropdown
            filteredCategories={filteredCategories}
            allFilteredIcons={allFilteredIcons}
            search={search}
            setSearch={setSearch}
            activeCategory={activeCategory}
            setActiveCategory={setActiveCategory}
            onSelect={(icon) => { onSelect(icon); setIsOpen(false); setSearch(""); }}
            onRemove={() => { onSelect(null); setIsOpen(false); setSearch(""); }}
            inputRef={inputRef}
          />
        )}
      </div>
    );
  }

  return (
    <div className="relative" ref={pickerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 text-sm text-muted-foreground/50 mb-2 transition-colors duration-100 hover:text-muted-foreground cursor-pointer opacity-0 group-hover/title:opacity-100"
        data-testid="button-add-icon"
      >
        <SmilePlus className="w-4 h-4" />
        <span>Add icon</span>
      </button>
      {isOpen && (
        <PickerDropdown
          filteredCategories={filteredCategories}
          allFilteredIcons={allFilteredIcons}
          search={search}
          setSearch={setSearch}
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
          onSelect={(icon) => { onSelect(icon); setIsOpen(false); setSearch(""); }}
          inputRef={inputRef}
        />
      )}
    </div>
  );
}

function PickerDropdown({
  filteredCategories,
  allFilteredIcons,
  search,
  setSearch,
  activeCategory,
  setActiveCategory,
  onSelect,
  onRemove,
  inputRef,
}: {
  filteredCategories: { name: string; icons: string[] }[];
  allFilteredIcons: string[];
  search: string;
  setSearch: (v: string) => void;
  activeCategory: number;
  setActiveCategory: (v: number) => void;
  onSelect: (icon: string) => void;
  onRemove?: () => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}) {
  return (
    <div
      className="absolute top-full left-0 z-50 mt-1 bg-popover border border-border rounded-lg shadow-xl w-[320px]"
      data-testid="icon-picker-dropdown"
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="p-3 pb-2">
        <div className="flex items-center gap-2 mb-2">
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter..."
            className="flex-1 h-8 px-2.5 text-sm bg-muted/50 border border-border rounded-md outline-none focus:border-primary/50 text-foreground placeholder:text-muted-foreground/50"
            data-testid="input-icon-search"
          />
          {onRemove && (
            <button
              onClick={onRemove}
              className="h-8 px-2.5 flex items-center gap-1.5 text-sm text-destructive rounded-md transition-colors hover-elevate"
              title="Remove icon"
              data-testid="button-remove-icon"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        {!search && (
          <div className="flex gap-1 mb-2 overflow-x-auto scrollbar-hide">
            {ICON_CATEGORIES.map((cat, i) => (
              <button
                key={cat.name}
                onClick={() => setActiveCategory(i)}
                className={`px-2 py-1 text-xs rounded-md whitespace-nowrap transition-colors ${
                  activeCategory === i
                    ? "bg-accent text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                data-testid={`icon-category-${cat.name.toLowerCase()}`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="px-3 pb-3 max-h-[240px] overflow-y-auto">
        {search ? (
          <div className="grid grid-cols-8 gap-0.5">
            {allFilteredIcons.map((icon, i) => (
              <IconButton key={`${icon}-${i}`} icon={icon} onClick={() => onSelect(icon)} />
            ))}
          </div>
        ) : (
          filteredCategories.length > 0 && (
            <div>
              <div className="text-xs text-muted-foreground mb-1.5 font-medium">
                {filteredCategories[activeCategory]?.name || filteredCategories[0]?.name}
              </div>
              <div className="grid grid-cols-8 gap-0.5">
                {(filteredCategories[activeCategory]?.icons || filteredCategories[0]?.icons || []).map((icon, i) => (
                  <IconButton key={`${icon}-${i}`} icon={icon} onClick={() => onSelect(icon)} />
                ))}
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}

function IconButton({ icon, onClick }: { icon: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-9 h-9 flex items-center justify-center text-xl rounded-md transition-colors duration-75 hover:bg-accent"
      data-testid={`icon-option-${icon}`}
    >
      {icon}
    </button>
  );
}
