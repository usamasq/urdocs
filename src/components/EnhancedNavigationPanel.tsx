import React, { useState, useEffect, useCallback } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronUp, 
  ChevronDown,
  Home,
  FileText,
  Eye,
  EyeOff,
  Settings,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  navigateToPage,
  validatePageIndex,
  type OverflowInfo 
} from '../utils/pageBreakUtils';

interface EnhancedNavigationPanelProps {
  pageCount: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  overflowInfo?: OverflowInfo;
  isOverflowing?: boolean;
  onTogglePageBreaks?: () => void;
  showPageBreaks?: boolean;
  onToggleFullscreen?: () => void;
  isFullscreen?: boolean;
}

const EnhancedNavigationPanel: React.FC<EnhancedNavigationPanelProps> = ({ 
  pageCount, 
  currentPage, 
  onPageChange,
  overflowInfo,
  isOverflowing = false,
  onTogglePageBreaks,
  showPageBreaks = true,
  onToggleFullscreen,
  isFullscreen = false
}) => {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const [jumpToPage, setJumpToPage] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  // Simple page navigation
  const handlePageNavigation = useCallback((pageIndex: number) => {
    const validatedPageIndex = validatePageIndex(pageIndex, pageCount);
    if (validatedPageIndex === currentPage) {
      return;
    }

    // Update the page state
    onPageChange(validatedPageIndex);
    
    // Navigate to the page
    navigateToPage(validatedPageIndex);
  }, [currentPage, pageCount, onPageChange]);

  // Jump to page handler
  const handleJumpToPage = (e: React.FormEvent) => {
    e.preventDefault();
    const pageNum = parseInt(jumpToPage);
    if (pageNum >= 1 && pageNum <= pageCount) {
      handlePageNavigation(pageNum - 1);
      setJumpToPage('');
    }
  };

  // Navigation handlers
  const handlePrevPage = () => {
    if (currentPage > 0) {
      handlePageNavigation(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < pageCount - 1) {
      handlePageNavigation(currentPage + 1);
    }
  };

  const handleFirstPage = () => {
    handlePageNavigation(0);
  };

  const handleLastPage = () => {
    handlePageNavigation(pageCount - 1);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'ArrowUp':
            e.preventDefault();
            handlePrevPage();
            break;
          case 'ArrowDown':
            e.preventDefault();
            handleNextPage();
            break;
          case 'Home':
            e.preventDefault();
            handleFirstPage();
            break;
          case 'End':
            e.preventDefault();
            handleLastPage();
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, pageCount]);

  // Don't show navigation for single page documents
  if (pageCount <= 1) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0 bg-background/80 backdrop-blur-sm border-border/50"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                <FileText className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Document Info</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className={`fixed bottom-4 right-4 z-50 transition-all duration-300 ${
        isExpanded ? 'w-80' : 'w-auto'
      }`}>
        {/* Main Navigation Panel */}
        <div className={`bg-background/90 backdrop-blur-md border border-border/50 rounded-lg shadow-lg transition-all duration-300 ${
          isExpanded ? 'p-4' : 'p-2'
        }`}>
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">
                {language === 'ur' ? 'صفحہ نیویگیشن' : 'Page Navigation'}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => setIsExpanded(!isExpanded)}
                  >
                    {isExpanded ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isExpanded ? 'Collapse' : 'Expand'}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* Compact View */}
          {!isExpanded && (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePrevPage}
                disabled={currentPage === 0}
                className="h-6 w-6 p-0"
              >
                <ChevronLeft className="w-3 h-3" />
              </Button>
              
              <div className="flex items-center gap-1 px-2 py-1 bg-muted/50 rounded text-xs">
                <span className="font-medium">{currentPage + 1}</span>
                <span className="text-muted-foreground">/</span>
                <span className="text-muted-foreground">{pageCount}</span>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleNextPage}
                disabled={currentPage >= pageCount - 1}
                className="h-6 w-6 p-0"
              >
                <ChevronRight className="w-3 h-3" />
              </Button>
            </div>
          )}

          {/* Expanded View */}
          {isExpanded && (
            <div className="space-y-3">
              {/* Page Info */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    Page {currentPage + 1} of {pageCount}
                  </Badge>
                  {isOverflowing && (
                    <Badge variant="destructive" className="text-xs">
                      Overflow
                    </Badge>
                  )}
                </div>
                {overflowInfo && (
                  <div className="text-xs text-muted-foreground">
                    {Math.round(overflowInfo.overflowAmount)}px over
                  </div>
                )}
              </div>


              {/* Navigation Controls */}
              <div className="space-y-2">

                {/* Main Navigation */}
                <div className="flex items-center justify-center gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleFirstPage}
                        disabled={currentPage === 0}
                        className="h-8 w-8 p-0"
                      >
                        <Home className="w-3 h-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>First page (Ctrl+Home)</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePrevPage}
                        disabled={currentPage === 0}
                        className="h-8 w-8 p-0"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Previous page (Ctrl+↑)</p>
                    </TooltipContent>
                  </Tooltip>

                  <div className="flex items-center gap-1 px-3 py-1 bg-muted/50 rounded-md min-w-[60px] justify-center">
                    <span className="text-sm font-medium">{currentPage + 1}</span>
                    <span className="text-xs text-muted-foreground">/</span>
                    <span className="text-xs text-muted-foreground">{pageCount}</span>
                  </div>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleNextPage}
                        disabled={currentPage >= pageCount - 1}
                        className="h-8 w-8 p-0"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Next page (Ctrl+↓)</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleLastPage}
                        disabled={currentPage >= pageCount - 1}
                        className="h-8 w-8 p-0"
                      >
                        <FileText className="w-3 h-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Last page (Ctrl+End)</p>
                    </TooltipContent>
                  </Tooltip>
                </div>

                {/* Jump to Page */}
                <form onSubmit={handleJumpToPage} className="flex items-center gap-2">
                  <Input
                    type="text"
                    value={jumpToPage}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || /^\d+$/.test(value)) {
                        setJumpToPage(value);
                      }
                    }}
                    placeholder="Page #"
                    className="h-8 text-xs text-center w-16"
                    maxLength={3}
                  />
                  <Button
                    type="submit"
                    size="sm"
                    className="h-8 px-3 text-xs"
                    disabled={!jumpToPage || parseInt(jumpToPage) < 1 || parseInt(jumpToPage) > pageCount}
                  >
                    Go
                  </Button>
                </form>
              </div>

              {/* Additional Controls */}
              <Separator />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {onTogglePageBreaks && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={onTogglePageBreaks}
                          className="h-6 w-6 p-0"
                        >
                          {showPageBreaks ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{showPageBreaks ? 'Hide' : 'Show'} page breaks</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>

                {onToggleFullscreen && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={onToggleFullscreen}
                        className="h-6 w-6 p-0"
                      >
                        {isFullscreen ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{isFullscreen ? 'Exit' : 'Enter'} fullscreen</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>

            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
};

export default EnhancedNavigationPanel;
