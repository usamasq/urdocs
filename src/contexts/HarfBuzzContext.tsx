/**
 * HarfBuzz Context Provider
 * 
 * This context provides centralized HarfBuzz initialization and state management
 * to prevent race conditions and ensure consistent state across components.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { harfbuzzService } from '../services/harfbuzzService';
import { harfBuzzErrorHandler } from '../services/harfBuzzErrorHandler';

export interface HarfBuzzContextType {
  isInitialized: boolean;
  isHarfBuzzAvailable: boolean;
  isInitializing: boolean;
  error: string | null;
  initializeHarfBuzz: () => Promise<void>;
  refreshStatus: () => void;
  getInitializationStatus: () => {
    isInitialized: boolean;
    isHarfBuzzAvailable: boolean;
    isInitializing: boolean;
    error: string | null;
  };
}

const HarfBuzzContext = createContext<HarfBuzzContextType | undefined>(undefined);

export const useHarfBuzz = (): HarfBuzzContextType => {
  const context = useContext(HarfBuzzContext);
  if (!context) {
    throw new Error('useHarfBuzz must be used within a HarfBuzzProvider');
  }
  return context;
};

interface HarfBuzzProviderProps {
  children: React.ReactNode;
}

export const HarfBuzzProvider: React.FC<HarfBuzzProviderProps> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isHarfBuzzAvailable, setIsHarfBuzzAvailable] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize HarfBuzz service
  const initializeHarfBuzz = useCallback(async () => {
    // Prevent multiple simultaneous initializations
    if (isInitializing || isInitialized) {
      return;
    }

    setIsInitializing(true);
    setError(null);

    try {
      // Initialize the service
      await harfbuzzService.initialize();
      
      // Load default Urdu fonts
      await harfbuzzService.loadDefaultUrduFonts();
      
      // Update state
      setIsInitialized(true);
      setIsHarfBuzzAvailable(harfbuzzService.isHarfBuzzAvailable());
      
      console.log('HarfBuzz context initialized successfully:', {
        isHarfBuzzAvailable: harfbuzzService.isHarfBuzzAvailable(),
        fallbackMode: !harfbuzzService.isHarfBuzzAvailable()
      });
    } catch (err) {
      // Use the error handler to process the error
      const hbError = harfBuzzErrorHandler.handleInitializationError(
        err as Error,
        { service: 'HarfBuzzContext', method: 'initializeHarfBuzz' }
      );
      
      setError(hbError.message);
      setIsInitialized(false);
      setIsHarfBuzzAvailable(false);
      
      console.warn('HarfBuzz context initialization failed:', hbError.message);
    } finally {
      setIsInitializing(false);
    }
  }, [isInitializing, isInitialized]);

  // Refresh status from service
  const refreshStatus = useCallback(() => {
    const serviceInitialized = harfbuzzService.isInitialized();
    const serviceAvailable = harfbuzzService.isHarfBuzzAvailable();
    
    setIsInitialized(serviceInitialized);
    setIsHarfBuzzAvailable(serviceAvailable);
    
    if (!serviceInitialized && !isInitializing) {
      setError('Service not initialized');
    } else if (serviceInitialized && error) {
      setError(null);
    }
  }, [isInitializing, error]);

  // Get current initialization status
  const getInitializationStatus = useCallback(() => {
    return {
      isInitialized,
      isHarfBuzzAvailable,
      isInitializing,
      error
    };
  }, [isInitialized, isHarfBuzzAvailable, isInitializing, error]);

  // Auto-initialize on mount with a small delay to prevent conflicts
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      initializeHarfBuzz();
    }, 100);

    return () => clearTimeout(timeoutId);
  }, []);

  const contextValue: HarfBuzzContextType = {
    isInitialized,
    isHarfBuzzAvailable,
    isInitializing,
    error,
    initializeHarfBuzz,
    refreshStatus,
    getInitializationStatus
  };

  return (
    <HarfBuzzContext.Provider value={contextValue}>
      {children}
    </HarfBuzzContext.Provider>
  );
};

export default HarfBuzzProvider;
