import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

export interface Page {
  id: string;
  content: string;
  height: number;
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
      checkAndManagePages
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
