import React from 'react';
import UrduEditor from './components/UrduEditor';
import { LanguageProvider } from './contexts/LanguageContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { PaginationProvider } from './contexts/PaginationContext';

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <PaginationProvider>
          <div className="min-h-screen">
            <UrduEditor />
          </div>
        </PaginationProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;