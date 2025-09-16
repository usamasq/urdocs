import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getScrollContainer, safeQuerySelector } from '../utils/pageBreakUtils';

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

  // Debug logging for pagination state
  if (process.env.NODE_ENV === 'development') {
    console.log('[PaginationControls] State:', {
      pageCount,
      currentPage,
      currentPageDisplay: currentPage + 1
    });
  }

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
    console.log('[PaginationControls] scrollToPage called with pageIndex:', pageIndex);
    // Get scroll container safely
    const container = getScrollContainer();
    if (!container) {
      console.warn('No scroll container found for page navigation');
      return;
    }
    console.log('[PaginationControls] Scroll container found:', container);
    console.log('[PaginationControls] Container scroll info:', {
      scrollTop: container.scrollTop,
      scrollHeight: container.scrollHeight,
      clientHeight: container.clientHeight,
      canScroll: container.scrollHeight > container.clientHeight
    });

    // Try to find page break indicators to calculate exact positions
    const pageBreakLines = safeQuerySelector('.page-break-line')?.parentElement?.querySelectorAll('.page-break-line');
    console.log('[PaginationControls] Page break lines found:', pageBreakLines?.length || 0);
    let scrollPosition = 0;

    if (pageIndex === 0) {
      // Scroll to top of document
      scrollPosition = 0;
    } else if (pageBreakLines && pageBreakLines.length > 0 && pageIndex <= pageBreakLines.length) {
      // Use actual page break positions with offset for better visibility
      const targetBreak = pageBreakLines[pageIndex - 1] as HTMLElement;
      if (targetBreak) {
        const rect = targetBreak.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        scrollPosition = container.scrollTop + (rect.top - containerRect.top) - 50; // 50px offset
      }
    } else {
      // Fallback: scroll to approximate position
      // Try to get the document container height for better calculation
      const documentContainer = safeQuerySelector('.document-container') as HTMLElement;
      if (documentContainer) {
        const containerHeight = documentContainer.clientHeight;
        scrollPosition = pageIndex * containerHeight - 50; // 50px offset
      } else {
        // More accurate fallback using container height
        const containerHeight = container.clientHeight;
        scrollPosition = pageIndex * Math.max(containerHeight, 800) - 50;
      }
    }

    // Ensure scroll position is not negative
    scrollPosition = Math.max(0, scrollPosition);

    console.log('[PaginationControls] Calculated scroll position:', scrollPosition);

    // Use requestAnimationFrame for smoother scrolling
    requestAnimationFrame(() => {
      console.log('[PaginationControls] Scrolling to position:', scrollPosition);
      container.scrollTo({ 
        top: scrollPosition, 
        behavior: 'smooth' 
      });
    });
  };

  const handleJumpInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow numbers
    if (value === '' || /^\d+$/.test(value)) {
      setJumpToPage(value);
    }
  };

  const handlePrevPage = () => {
    console.log('[PaginationControls] handlePrevPage called, currentPage:', currentPage);
    if (currentPage > 0) {
      const newPage = currentPage - 1;
      console.log('[PaginationControls] Previous page clicked, going to page:', newPage);
      onPageChange(newPage);
      console.log('[PaginationControls] About to call scrollToPage with:', newPage);
      scrollToPage(newPage);
    } else {
      console.log('[PaginationControls] Cannot go to previous page, currentPage is 0');
    }
  };

  const handleNextPage = () => {
    console.log('[PaginationControls] handleNextPage called, currentPage:', currentPage, 'pageCount:', pageCount);
    if (currentPage < pageCount - 1) {
      const newPage = currentPage + 1;
      console.log('[PaginationControls] Next page clicked, going to page:', newPage);
      onPageChange(newPage);
      console.log('[PaginationControls] About to call scrollToPage with:', newPage);
      scrollToPage(newPage);
    } else {
      console.log('[PaginationControls] Cannot go to next page, currentPage is at max');
    }
  };

  if (pageCount <= 1) return null;

  return (
    <TooltipProvider>
      <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-center gap-4 px-4 py-3 bg-muted/30 border-t border-border backdrop-blur-sm">
        {/* Page Navigation */}
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePrevPage}
                disabled={currentPage === 0}
                className="h-8 w-8 p-0 transition-all duration-200 hover:bg-accent hover:text-accent-foreground disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Previous page</p>
            </TooltipContent>
          </Tooltip>
          
          <div className="flex items-center gap-2 px-3 py-1.5 bg-background/50 rounded-md border border-border">
            <span className="text-sm font-medium text-foreground">
              {currentPage + 1}
            </span>
            <span className="text-sm text-muted-foreground">
              of {pageCount}
            </span>
          </div>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleNextPage}
                disabled={currentPage >= pageCount - 1}
                className="h-8 w-8 p-0 transition-all duration-200 hover:bg-accent hover:text-accent-foreground disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Next page</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Jump to Page */}
        {pageCount > 1 && (
          <form onSubmit={handleJumpToPage} className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <label htmlFor="jump-to-page" className="text-xs text-muted-foreground">
                Go to:
              </label>
              <Input
                id="jump-to-page"
                type="text"
                value={jumpToPage}
                onChange={handleJumpInputChange}
                placeholder="1"
                className="w-12 h-8 text-xs text-center"
                maxLength={3}
              />
            </div>
            <Button
              type="submit"
              size="sm"
              className="h-8 px-3 text-xs transition-all duration-200"
              disabled={!jumpToPage || parseInt(jumpToPage) < 1 || parseInt(jumpToPage) > pageCount}
            >
              Go
            </Button>
          </form>
        )}
      </div>
    </TooltipProvider>
  );
};

export default PaginationControls;