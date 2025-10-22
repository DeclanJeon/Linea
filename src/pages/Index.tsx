import { usePlayer } from '@/contexts/PlayerContext';
import { usePlaylist } from '@/contexts/PlaylistContext';
import { YouTubePlayer } from '@/components/YouTubePlayer';
import { AddTrackForm } from '@/components/AddTrackForm';
import { PlaylistView } from '@/components/PlaylistView';
import { PlayerControls } from '@/components/PlayerControls';
import { PlaylistManager } from '@/components/PlaylistManager';
import { PlaylistImportExport } from '@/components/PlaylistImportExport';
import { Music2, Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

/**
 * Index 페이지
 * 
 * 애플리케이션의 메인 페이지로 모든 주요 UI 컴포넌트를 구성합니다.
 */
const Index = () => {
  const { state: playerState } = usePlayer();
  const {
    currentPlaylist,
    isLoading: playlistLoading,
    error: playlistError,
  } = usePlaylist();

  const { currentIndex, error: playerError, isLoading: playerLoading } = playerState;
  const currentTrack = playerState.tracks[currentIndex];

  /**
   * 에러 렌더링
   */
  const renderError = () => {
    const error = playerError || playlistError;
    if (!error) return null;

    return (
      <Alert variant="destructive" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>오류 발생</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  };

  /**
   * 로딩 상태
   */
  if (playlistLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">플레이리스트를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-primary mb-4 shadow-glow-primary">
            <Music2 className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-primary bg-clip-text text-transparent">
            YouTube Music Player
          </h1>
          <p className="text-muted-foreground">
            YouTube 링크로 나만의 플레이리스트를 만들어보세요
          </p>
        </div>

        {/* 에러 표시 */}
        {renderError()}

        {/* Playlist Manager */}
        <div className="bg-card rounded-xl p-6 border border-border mb-6">
          <h2 className="text-xl font-semibold mb-4">플레이리스트 관리</h2>
          <div className="space-y-3">
            <PlaylistManager />
            {currentPlaylist && <PlaylistImportExport />}
          </div>
        </div>

        {/* Add Track Form */}
        <div className="bg-card rounded-xl p-6 border border-border mb-6">
          <h2 className="text-xl font-semibold mb-4">트랙 추가</h2>
          <AddTrackForm />
        </div>

        {/* Current Playing */}
        {currentTrack && (
          <div className="bg-card rounded-xl p-6 border border-border mb-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-20 h-20 rounded-lg overflow-hidden bg-gradient-accent shadow-glow-accent flex-shrink-0 relative">
                {currentTrack.thumbnail ? (
                  <img
                    src={currentTrack.thumbnail}
                    alt={currentTrack.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                      const parent = (e.target as HTMLImageElement).parentElement;
                      if (parent) {
                        const fallback = parent.querySelector('.fallback-icon');
                        if (fallback) {
                          fallback.classList.remove('hidden');
                        }
                      }
                    }}
                  />
                ) : null}
                <div className={currentTrack.thumbnail ? 'fallback-icon hidden w-full h-full flex items-center justify-center' : 'w-full h-full flex items-center justify-center'}>
                  <Music2 className="h-10 w-10 text-white" />
                </div>
                {playerLoading && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <Loader2 className="h-6 w-6 text-white animate-spin" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-muted-foreground mb-1">현재 재생 중</p>
                <h3 className="text-xl font-semibold truncate">{currentTrack.title}</h3>
                <p className="text-sm text-muted-foreground truncate">{currentTrack.videoId}</p>
              </div>
            </div>

            <PlayerControls />
          </div>
        )}

        {/* Playlist */}
        <div className="bg-card rounded-xl p-6 border border-border">
          <h2 className="text-xl font-semibold mb-4">
            플레이리스트 ({playerState.tracks.length}곡)
          </h2>
          <PlaylistView />
        </div>
      </div>

      {/* YouTube Player (hidden) */}
      <YouTubePlayer />
    </div>
  );
};

export default Index;