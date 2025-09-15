import React from 'react';
import UrduEditor from './components/UrduEditor';
import ErrorBoundary from './components/ErrorBoundary';
import { LanguageProvider } from './contexts/LanguageContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { PaginationProvider } from './contexts/PaginationContext';

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <LanguageProvider>
          <PaginationProvider>
            <div className="min-h-screen">
              <UrduEditor />
            </div>
          </PaginationProvider>
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;