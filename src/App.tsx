import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { PlayerProvider } from '@/contexts/PlayerContext';
import { PlaylistProvider } from '@/contexts/PlaylistContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import Index from './pages/Index';
import NotFound from './pages/NotFound';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

/**
 * App 컴포넌트
 * 
 * 애플리케이션의 루트 컴포넌트로, 다음 Provider들을 중첩합니다:
 * 1. ErrorBoundary - 에러 처리
 * 2. QueryClientProvider - React Query 설정
 * 3. TooltipProvider - Tooltip UI
 * 4. PlayerProvider - 플레이어 상태 관리 (먼저 마운트)
 * 5. PlaylistProvider - 플레이리스트 상태 관리 (나중에 마운트)
 * 
 * ⚠️ 중요: PlayerProvider가 PlaylistProvider보다 먼저 와야 합니다.
 * PlaylistProvider 내부에서 usePlayer 훅을 사용하기 때문입니다.
 */
const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <PlayerProvider>
          <PlaylistProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </PlaylistProvider>
        </PlayerProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
