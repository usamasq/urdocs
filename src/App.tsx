import React from 'react';
import UrduEditor from './components/UrduEditor';
import ErrorBoundary from './components/ErrorBoundary';
import { LanguageProvider } from './contexts/LanguageContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { HarfBuzzProvider } from './contexts/HarfBuzzContext';
import { SimplePaginationProvider } from './contexts/SimplePaginationContext';

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <LanguageProvider>
          <HarfBuzzProvider>
            <SimplePaginationProvider>
              <div className="min-h-screen">
                <UrduEditor />
              </div>
            </SimplePaginationProvider>
          </HarfBuzzProvider>
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;