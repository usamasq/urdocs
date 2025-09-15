import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { AppError } from '../types';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: AppError) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const appError: AppError = {
      message: error.message,
      code: error.name,
      context: 'ErrorBoundary',
      timestamp: new Date(),
    };

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error caught by ErrorBoundary:', error, errorInfo);
    }

    // Call onError callback if provided
    this.props.onError?.(appError);

    this.setState({
      error,
      errorInfo,
    });
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return <ErrorFallback 
        error={this.state.error} 
        onRetry={this.handleRetry}
        onReload={this.handleReload}
      />;
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error: Error | null;
  onRetry: () => void;
  onReload: () => void;
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({ error, onRetry, onReload }) => {
  // Use English as default for error messages to avoid context dependency issues
  const isUrdu = false;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full bg-card border border-border rounded-lg shadow-lg p-6 text-center">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-destructive/10 rounded-full">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
        </div>
        
        <h1 className="text-xl font-semibold text-foreground mb-2">
          {isUrdu ? 'کچھ غلط ہو گیا' : 'Something went wrong'}
        </h1>
        
        <p className="text-muted-foreground mb-6">
          {isUrdu 
            ? 'ایک غیر متوقع خرابی پیش آئی ہے۔ براہ کرم دوبارہ کوشش کریں۔'
            : 'An unexpected error occurred. Please try again.'
          }
        </p>

        {process.env.NODE_ENV === 'development' && error && (
          <details className="mb-6 text-left">
            <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
              {isUrdu ? 'خرابی کی تفصیلات' : 'Error Details'}
            </summary>
            <div className="mt-2 p-3 bg-muted rounded text-xs font-mono text-muted-foreground overflow-auto max-h-32">
              <div className="mb-2">
                <strong>{isUrdu ? 'خرابی:' : 'Error:'}</strong> {error.message}
              </div>
              {error.stack && (
                <div>
                  <strong>{isUrdu ? 'اسٹیک:' : 'Stack:'}</strong>
                  <pre className="whitespace-pre-wrap">{error.stack}</pre>
                </div>
              )}
            </div>
          </details>
        )}

        <div className="flex gap-3 justify-center">
          <button
            onClick={onRetry}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            {isUrdu ? 'دوبارہ کوشش کریں' : 'Try Again'}
          </button>
          
          <button
            onClick={onReload}
            className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 transition-colors"
          >
            <Home className="w-4 h-4" />
            {isUrdu ? 'صفحہ دوبارہ لوڈ کریں' : 'Reload Page'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorBoundary;
