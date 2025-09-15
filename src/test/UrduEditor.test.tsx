import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LanguageProvider } from '../contexts/LanguageContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import { PaginationProvider } from '../contexts/PaginationContext';
import UrduEditor from '../components/UrduEditor';

// Mock the TipTap editor
vi.mock('@tiptap/react', () => ({
  useEditor: vi.fn(() => ({
    chain: vi.fn(() => ({
      focus: vi.fn(() => ({
        setFontFamily: vi.fn(() => ({
          run: vi.fn(),
        })),
        setFontSize: vi.fn(() => ({
          run: vi.fn(),
        })),
      })),
    })),
    can: vi.fn(() => ({
      undo: vi.fn(() => true),
      redo: vi.fn(() => true),
    })),
    isActive: vi.fn(() => false),
    on: vi.fn(),
    off: vi.fn(),
  })),
  EditorContent: ({ children }: { children: React.ReactNode }) => <div data-testid="editor-content">{children}</div>,
}));

// Mock the Urdu keyboard hook
vi.mock('../hooks/useUrduKeyboard', () => ({
  useUrduKeyboard: vi.fn(),
}));

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider>
    <LanguageProvider>
      <PaginationProvider>
        {children}
      </PaginationProvider>
    </LanguageProvider>
  </ThemeProvider>
);

describe('UrduEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(
      <TestWrapper>
        <UrduEditor />
      </TestWrapper>
    );

    // Check if the main editor elements are present
    expect(screen.getByText(/اردو ایڈیٹر|Urdu Editor/)).toBeInTheDocument();
  });

  it('displays the correct title based on language', () => {
    render(
      <TestWrapper>
        <UrduEditor />
      </TestWrapper>
    );

    // Should show Urdu title by default
    expect(screen.getByText('اردو ایڈیٹر')).toBeInTheDocument();
  });

  it('renders the editor content area', () => {
    render(
      <TestWrapper>
        <UrduEditor />
      </TestWrapper>
    );

    expect(screen.getByTestId('editor-content')).toBeInTheDocument();
  });

  it('renders toolbar components', () => {
    render(
      <TestWrapper>
        <UrduEditor />
      </TestWrapper>
    );

    // Check for toolbar elements (these would be present in the actual toolbar)
    expect(screen.getByRole('button', { name: /settings/i })).toBeInTheDocument();
  });
});
