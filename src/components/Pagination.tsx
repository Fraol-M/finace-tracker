import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  startIdx: number;
  endIdx: number;
  totalItems: number;
  containerClassName?: string;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  startIdx,
  endIdx,
  totalItems,
  containerClassName = "p-4 border-t border-white/5 flex items-center justify-between mt-auto bg-[#1c1b1b]/30"
}: PaginationProps) {
  return (
    <div className={containerClassName}>
      <span className="font-sans text-xs text-[#bbcabf]">
        Showing <span className="font-semibold text-white">{totalItems > 0 ? startIdx : 0}</span> to{' '}
        <span className="font-semibold text-white">{endIdx}</span> of{' '}
        <span className="font-semibold text-white">{totalItems}</span> results
      </span>
      
      <div className="flex items-center gap-1.5 select-none text-xs">
        {/* Prev button */}
        <button 
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="p-1.5 rounded bg-zinc-800 text-[#bbcabf] hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center h-7 w-7"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        {/* Pagination keys */}
        {Array.from({ length: totalPages }).map((_, idx) => {
          const pageNum = idx + 1;
          const isSelected = currentPage === pageNum;
          return (
            <button 
              key={idx}
              onClick={() => onPageChange(pageNum)}
              className={`w-7 h-7 rounded font-mono font-bold transition-all cursor-pointer flex items-center justify-center text-xs ${
                isSelected 
                  ? 'bg-[#4edea3]/20 text-[#4edea3] border border-[#4edea3]/30' 
                  : 'text-[#bbcabf] hover:text-white hover:bg-white/5'
              }`}
            >
              {pageNum}
            </button>
          );
        })}

        {/* Next button */}
        <button 
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="p-1.5 rounded bg-zinc-800 text-[#bbcabf] hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center h-7 w-7"
          aria-label="Next page"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
