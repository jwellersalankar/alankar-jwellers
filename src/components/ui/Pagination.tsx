"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({
  totalPages,
  currentPage,
  setCurrentPage,
}: {
  totalPages: number;
  currentPage: number;
  setCurrentPage: (page: number) => void;
})  {
  const [showJump, setShowJump] = useState(false);
  const [jumpPage, setJumpPage] = useState("");
  const popupRef = useRef<HTMLDivElement>(null);

  // 🔥 Close popup on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setShowJump(false);
      }
    }

    if (showJump) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showJump]);

  // 🔥 Handle Jump
  const handleJump = () => {
    const page = Number(jumpPage);
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      setShowJump(false);
      setJumpPage("");
    }
  };

  // 🔥 Enter key support
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleJump();
    }
  };

  // 🔥 Smart Pagination Logic (Google style)
  const getPages = () => {
    const pages: (number | string)[] = [];

    if (totalPages <= 10) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const startPages = [1, 2];
    const endPages = [totalPages - 1, totalPages];

    const middleStart = Math.max(currentPage - 2, 3);
    const middleEnd = Math.min(currentPage + 2, totalPages - 2);

    // Start pages
    pages.push(...startPages);

    // Left dots
    if (middleStart > 3) {
      pages.push("...");
    }

    // Middle pages
    for (let i = middleStart; i <= middleEnd; i++) {
      pages.push(i);
    }

    // Right dots
    if (middleEnd < totalPages - 2) {
      pages.push("...");
    }

    // End pages
    pages.push(...endPages);

    return pages;
  };

  const pages = getPages();

  return (
    <div className="relative flex items-center gap-1">
      {/* Prev */}
      <button
        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="w-9 h-9 flex items-center justify-center rounded-md text-[#6B5040] hover:bg-[#EDE4DA] disabled:opacity-30 transition-colors duration-150"
      >
        <ChevronLeft size={16} strokeWidth={2} />
      </button>

      {/* Pages */}
      {pages.map((page, index) =>
        page === "..." ? (
          <button
            key={index}
            onClick={() => setShowJump(true)}
            className="w-9 h-9 flex items-center justify-center rounded-md text-[#5C4A3A] hover:bg-[#EDE4DA] transition-colors duration-150"
          >
            ...
          </button>
        ) : (
          <button
            key={page}
            onClick={() => setCurrentPage(Number(page))}
            className={`w-9 h-9 flex items-center justify-center rounded-md text-[13px] font-semibold transition-colors duration-150 ${
              currentPage === page
                ? "bg-[#6B2020] text-white"
                : "text-[#5C4A3A] hover:bg-[#EDE4DA]"
            }`}
            style={{ fontFamily: "'Georgia', serif" }}
          >
            {page}
          </button>
        )
      )}

      {/* Next */}
      <button
        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="w-9 h-9 flex items-center justify-center rounded-md text-[#6B5040] hover:bg-[#EDE4DA] disabled:opacity-30 transition-colors duration-150"
      >
        <ChevronRight size={16} strokeWidth={2} />
      </button>

      {/* 🔥 Jump Popup */}
      {showJump && (
        <div
          ref={popupRef}
          className="absolute top-12 left-1/2 -translate-x-1/2 bg-white border border-[#EDE4DA] shadow-lg rounded-lg p-3 flex items-center gap-2 z-50"
        >
          <input
            type="number"
            value={jumpPage}
            onChange={(e) => setJumpPage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Page"
            className="w-16 px-2 py-1 border border-[#EDE4DA] rounded-md text-sm outline-none"
            autoFocus
          />
          <button
            onClick={handleJump}
            className="px-3 py-1 rounded-md bg-[#6B2020] text-white text-sm hover:opacity-90"
          >
            Go
          </button>
          <button
            onClick={() => setShowJump(false)}
            className="text-xs text-[#6B5040]"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}