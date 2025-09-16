import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { type OverflowInfo } from '../utils/pageBreakUtils';

export interface Page {
  id: string;
  content: string;
  height: number;
  isOverflowing?: boolean;
  overflowAmount?: number;
}

interface OverflowStatus {
  isOverflowing: boolean;
  overflowAmount: number;
  breakPoint?: number;
}

interface PaginationContextType {
  pages: Page[];
  currentPage: number;
  totalPages: number;
  addPage: () => void;
  removePage: (pageId: string) => void;
  updatePageContent: (pageId: string, content: string) => void;
  setCurrentPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  canGoNext: boolean;
  canGoPrev: boolean;
  getPageContent: (pageId: string) => string;
  setPageHeight: (pageId: string, height: number) => void;
  checkAndManagePages: () => void;
  // Enhanced overflow management
  checkPageOverflow: (pageId: string, contentHeight: number, availableHeight: number) => void;
  getOverflowStatus: (pageId: string) => OverflowStatus | null;
  splitContentAtOverflow: (pageId: string, breakPoint?: number) => void;
  reflowContent: () => void;
}

const PaginationContext = createContext<PaginationContextType | undefined>(undefined);

export const PaginationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [pages, setPages] = useState<Page[]>([
    { 
      id: 'page-1', 
      content: '', 
      height: 0
    }
  ]);
  const [currentPage, setCurrentPage] = useState(0);

  const totalPages = pages.length;

  const addPage = useCallback(() => {
    const newPageId = `page-${Date.now()}`;
    setPages(prev => [...prev, { 
      id: newPageId, 
      content: '', 
      height: 0
    }]);
  }, []);

  const removePage = (pageId: string) => {
    if (pages.length <= 1) return; // Don't remove the last page
    
    setPages(prev => {
      const newPages = prev.filter(page => page.id !== pageId);
      const removedIndex = prev.findIndex(page => page.id === pageId);
      
      // Adjust current page if needed
      if (removedIndex <= currentPage && currentPage > 0) {
        setCurrentPage(currentPage - 1);
      }
      
      return newPages;
    });
  };

  const updatePageContent = (pageId: string, content: string) => {
    setPages(prev => prev.map(page => 
      page.id === pageId ? { ...page, content } : page
    ));
  };

  const nextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const canGoNext = currentPage < totalPages - 1;
  const canGoPrev = currentPage > 0;

  const getPageContent = (pageId: string) => {
    const page = pages.find(p => p.id === pageId);
    return page?.content || '';
  };

  const setPageHeight = useCallback((pageId: string, height: number) => {
    setPages(prev => prev.map(page => 
      page.id === pageId ? { ...page, height } : page
    ));
  }, []);

  // Automatic page management based on content
  const checkAndManagePages = useCallback(() => {
    setPages(prev => {
      // Remove empty pages except the last one
      const nonEmptyPages = prev.filter((page, index) => {
        // Keep the page if it has content or if it's the last page
        return page.content.trim() !== '' || index === prev.length - 1;
      });

      // If we removed pages and current page is now out of bounds, adjust it
      if (nonEmptyPages.length < prev.length && currentPage >= nonEmptyPages.length) {
        setCurrentPage(Math.max(0, nonEmptyPages.length - 1));
      }

      return nonEmptyPages;
    });
  }, [currentPage]);

  // Enhanced overflow management functions
  const checkPageOverflow = useCallback((pageId: string, contentHeight: number, availableHeight: number) => {
    setPages(prev => prev.map(page => {
      if (page.id === pageId) {
        const isOverflowing = contentHeight > availableHeight;
        const overflowAmount = Math.max(0, contentHeight - availableHeight);
        return {
          ...page,
          isOverflowing,
          overflowAmount
        };
      }
      return page;
    }));
  }, []);

  const getOverflowStatus = useCallback((pageId: string): OverflowStatus | null => {
    const page = pages.find(p => p.id === pageId);
    if (!page) return null;
    
    return {
      isOverflowing: page.isOverflowing || false,
      overflowAmount: page.overflowAmount || 0
    };
  }, [pages]);

  const splitContentAtOverflow = useCallback((pageId: string, breakPoint?: number) => {
    setPages(prev => {
      const pageIndex = prev.findIndex(p => p.id === pageId);
      if (pageIndex === -1) return prev;

      const currentPage = prev[pageIndex];
      if (!currentPage.isOverflowing) return prev;

      // Create new page with overflow content
      const newPageId = `page-${Date.now()}`;
      const newPage: Page = {
        id: newPageId,
        content: '', // Content will be moved by the editor
        height: 0,
        isOverflowing: false,
        overflowAmount: 0
      };

      // Insert new page after current page
      const newPages = [...prev];
      newPages.splice(pageIndex + 1, 0, newPage);

      return newPages;
    });
  }, []);

  const reflowContent = useCallback(() => {
    // This would implement content reflowing across pages
    // For now, just reset overflow status
    setPages(prev => prev.map(page => ({
      ...page,
      isOverflowing: false,
      overflowAmount: 0
    })));
  }, []);

  return (
    <PaginationContext.Provider value={{
      pages,
      currentPage,
      totalPages,
      addPage,
      removePage,
      updatePageContent,
      setCurrentPage,
      nextPage,
      prevPage,
      canGoNext,
      canGoPrev,
      getPageContent,
      setPageHeight,
      checkAndManagePages,
      // Enhanced overflow management
      checkPageOverflow,
      getOverflowStatus,
      splitContentAtOverflow,
      reflowContent
    }}>
      {children}
    </PaginationContext.Provider>
  );
};

export const usePagination = () => {
  const context = useContext(PaginationContext);
  if (context === undefined) {
    throw new Error('usePagination must be used within a PaginationProvider');
  }
  return context;
};
