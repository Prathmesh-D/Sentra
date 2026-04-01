import { useState, useRef, useEffect, useCallback } from "react";
import { FiSearch, FiChevronDown, FiX } from "react-icons/fi";

interface SortOption {
  value: string;
  label: string;
}

interface FilterBarProps {
  /** Dynamic tag filters (e.g. ["all", "active", "expired"]) */
  tags: string[];
  /** Currently active tag */
  activeTag: string;
  /** Callback when tag changes */
  onTagChange: (tag: string) => void;
  /** Search query value */
  searchQuery: string;
  /** Callback when search changes */
  onSearchChange: (query: string) => void;
  /** Search placeholder text */
  searchPlaceholder?: string;
  /** Sort options specific to the view */
  sortOptions: SortOption[];
  /** Currently active sort field */
  sortBy: string;
  /** Current sort direction */
  sortOrder: "asc" | "desc";
  /** Callback when sort changes */
  onSortToggle: (field: string) => void;
}

export default function FilterBar({
  tags,
  activeTag,
  onTagChange,
  searchQuery,
  onSearchChange,
  searchPlaceholder = "Search...",
  sortOptions,
  sortBy,
  sortOrder,
  onSortToggle,
}: FilterBarProps) {
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);
  const pillsRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  // Close sort dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setSortOpen(false);
      }
    };
    if (sortOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [sortOpen]);

  // Sliding indicator position
  const updateIndicator = useCallback(() => {
    if (!pillsRef.current) return;
    const activeBtn = pillsRef.current.querySelector<HTMLButtonElement>(
      `[data-tag="${CSS.escape(activeTag)}"]`
    );
    if (activeBtn) {
      const containerRect = pillsRef.current.getBoundingClientRect();
      const btnRect = activeBtn.getBoundingClientRect();
      setIndicatorStyle({
        left: btnRect.left - containerRect.left,
        width: btnRect.width,
      });
    }
  }, [activeTag]);

  useEffect(() => {
    updateIndicator();
  }, [updateIndicator, tags]);

  // Recalculate on window resize
  useEffect(() => {
    window.addEventListener("resize", updateIndicator);
    return () => window.removeEventListener("resize", updateIndicator);
  }, [updateIndicator]);

  const activeSortLabel =
    sortOptions.find((o) => o.value === sortBy)?.label ?? "Sort";

  const hasActiveFilter = activeTag !== "all";

  return (
    <div className="flex flex-col gap-3">
      {/* Combined control bar — search + sort on one line */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="flex-1 relative">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full pl-10 pr-4 py-2.5 h-[38px] text-[13px] bg-gray-50 border border-gray-200 rounded-[10px] focus:outline-none focus:border-[#b2f7ef] focus:bg-white transition-all duration-200 placeholder:text-gray-400"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <FiX className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Sort dropdown */}
        <div ref={sortRef} className="relative">
          <button
            onClick={() => setSortOpen((p) => !p)}
            className="flex items-center gap-1.5 h-[38px] px-3.5 text-[13px] font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-[10px] hover:bg-gray-100 transition-all duration-150 whitespace-nowrap"
          >
            <span className="text-gray-400 text-[11px]">Sort:</span>
            <span>{activeSortLabel}</span>
            <span className="text-[10px] text-gray-400">
              {sortOrder === "asc" ? "↑" : "↓"}
            </span>
            <FiChevronDown
              className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${
                sortOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {sortOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-44 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-1 filter-dropdown-enter">
              {sortOptions.map((option) => {
                const isActive = sortBy === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() => {
                      onSortToggle(option.value);
                      setSortOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2 text-[13px] transition-colors duration-150 ${
                      isActive
                        ? "text-[#084d45] bg-[#b2f7ef]/15 font-medium"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <span>{option.label}</span>
                    {isActive && (
                      <span className="text-[#084d45] text-xs">
                        {sortOrder === "asc" ? "↑ Asc" : "↓ Desc"}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Filter pills row */}
      <div className="flex items-center gap-2">
        <div ref={pillsRef} className="relative flex items-center gap-1.5 bg-gray-100/80 rounded-full p-1">
          {/* Sliding indicator */}
          <div
            className="absolute top-1 bottom-1 bg-gradient-to-r from-[#b2f7ef] to-[#97eeff] rounded-full transition-all duration-200 ease-out shadow-sm"
            style={{
              left: indicatorStyle.left,
              width: indicatorStyle.width,
            }}
          />

          {tags.map((tag) => (
            <button
              key={tag}
              data-tag={tag}
              onClick={() => onTagChange(tag)}
              className={`relative z-10 px-3.5 py-1.5 rounded-full text-[13px] font-medium capitalize transition-colors duration-200 whitespace-nowrap ${
                activeTag === tag
                  ? "text-[#084d45]"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Active filter chip — dismissible */}
        {hasActiveFilter && (
          <button
            onClick={() => onTagChange("all")}
            className="flex items-center gap-1 px-2.5 py-1 text-[12px] font-medium text-[#084d45] bg-[#b2f7ef]/25 border border-[#b2f7ef]/40 rounded-full hover:bg-[#b2f7ef]/35 transition-all duration-150 filter-chip-enter"
          >
            <span className="capitalize">{activeTag}</span>
            <FiX className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
}
