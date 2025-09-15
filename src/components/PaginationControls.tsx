import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface PaginationControlsProps {
  pageCount: number;
  currentPage: number;
  onPageChange: (page: number) => void;
}

const PaginationControls: React.FC<PaginationControlsProps> = ({ 
  pageCount, 
  currentPage, 
  onPageChange 
}) => {
  const { language } = useLanguage();
  const [jumpToPage, setJumpToPage] = useState('');

  const handleJumpToPage = (e: React.FormEvent) => {
    e.preventDefault();
    const pageNum = parseInt(jumpToPage);
    if (pageNum >= 1 && pageNum <= pageCount) {
      const targetPageIndex = pageNum - 1;
      onPageChange(targetPageIndex);
      scrollToPage(targetPageIndex);
      setJumpToPage('');
    }
  };

  const scrollToPage = (pageIndex: number) => {
    // Try multiple selectors for different editor types
    const selectors = [
      `[data-page-id]`, // SimplifiedMultiPageEditor
      `[data-page="${pageIndex}"]`, // EnhancedContinuousEditor
      `.doc-page` // Fallback
    ];
    
    let pageElement: Element | null = null;
    
    for (const selector of selectors) {
      const elements = document.querySelectorAll(selector);
      if (elements[pageIndex]) {
        pageElement = elements[pageIndex];
        break;
      }
    }
    
    if (pageElement) {
      pageElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start',
        inline: 'nearest'
      });
    } else {
      // Fallback: scroll to approximate position
      const container = document.querySelector('.flex-1.overflow-y-auto');
      if (container) {
        const scrollTop = pageIndex * 800; // Approximate page height
        container.scrollTo({ top: scrollTop, behavior: 'smooth' });
      }
    }
  };

  const handleJumpInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow numbers
    if (value === '' || /^\d+$/.test(value)) {
      setJumpToPage(value);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 0) {
      const newPage = currentPage - 1;
      onPageChange(newPage);
      scrollToPage(newPage);
    }
  };

  const handleNextPage = () => {
    if (currentPage < pageCount - 1) {
      const newPage = currentPage + 1;
      onPageChange(newPage);
      scrollToPage(newPage);
    }
  };

  if (pageCount <= 1) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-center gap-4 px-4 py-2 bg-muted/30 border-t border-border backdrop-blur-sm">
      {/* Page Navigation */}
      <div className="flex items-center gap-2">
        <button
          onClick={handlePrevPage}
          disabled={currentPage === 0}
          className="p-2 rounded-md hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150"
          title="Previous page"
        >
          <ChevronLeft className="w-4 h-4 text-muted-foreground" />
        </button>
        
        <div className="flex items-center gap-2 px-3 py-1 bg-background/50 rounded-md border border-border">
          <span className="text-sm font-medium text-foreground">
            {currentPage + 1}
          </span>
          <span className="text-sm text-muted-foreground">
            of {pageCount}
          </span>
        </div>
        
        <button
          onClick={handleNextPage}
          disabled={currentPage >= pageCount - 1}
          className="p-2 rounded-md hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150"
          title="Next page"
        >
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Jump to Page */}
      {pageCount > 1 && (
        <form onSubmit={handleJumpToPage} className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <label htmlFor="jump-to-page" className="text-xs text-muted-foreground">
              Go to:
            </label>
            <input
              id="jump-to-page"
              type="text"
              value={jumpToPage}
              onChange={handleJumpInputChange}
              placeholder="1"
              className="w-12 px-2 py-1 text-xs text-center bg-background border border-border rounded text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              maxLength={3}
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!jumpToPage || parseInt(jumpToPage) < 1 || parseInt(jumpToPage) > pageCount}
            title="Jump to page"
          >
            Go
          </button>
        </form>
      )}
    </div>
  );
};

export default PaginationControls;