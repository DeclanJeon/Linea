import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary 컴포넌트
 * 
 * React 애플리케이션의 최상위에서 예상치 못한 에러를 포착하고
 * 사용자에게 친화적인 에러 메시지를 표시합니다.
 */
export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] 포착된 에러:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>애플리케이션 오류가 발생했습니다</AlertTitle>
              <AlertDescription className="mt-2">
                <p className="mb-4">
                  예상치 못한 오류가 발생했습니다. 페이지를 새로고침하면 문제가 해결될 수 있습니다.
                </p>
                {this.state.error && (
                  <details className="mb-4 text-xs">
                    <summary className="cursor-pointer">기술적 세부사항</summary>
                    <pre className="mt-2 p-2 bg-muted rounded overflow-auto">
                      {this.state.error.toString()}
                    </pre>
                  </details>
                )}
                <Button onClick={this.handleReset} className="w-full">
                  페이지 새로고침
                </Button>
              </AlertDescription>
            </Alert>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}