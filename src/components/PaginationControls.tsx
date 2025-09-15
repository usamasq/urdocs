import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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