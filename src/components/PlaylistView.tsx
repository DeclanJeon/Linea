import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trash2, Music, Play, Loader2 } from 'lucide-react';
import { usePlayer } from '@/contexts/PlayerContext';
import { usePlaylist } from '@/contexts/PlaylistContext';
import { getYouTubeThumbnail } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { useState } from 'react';

/**
 * PlaylistView 컴포넌트
 * 
 * 플레이리스트의 트랙 목록을 표시하고 사용자 상호작용을 처리합니다.
 * 현재 재생 중인 트랙을 시각적으로 강조합니다.
 */
export const PlaylistView = () => {
  const { state: playerState, actions: playerActions } = usePlayer();
  const { tracks, deleteTrack } = usePlaylist();
  const [clickedTrackId, setClickedTrackId] = useState<string | null>(null);
  
  const { currentIndex, isLoading: playerLoading } = playerState;

  /**
   * 트랙 삭제 핸들러
   */
  const handleDelete = async (trackId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    await deleteTrack(trackId);
  };

  /**
   * 트랙 선택 핸들러
   * 
   * 사용자가 트랙을 클릭하면 즉각적인 시각적 피드백을 제공하고
   * 해당 트랙을 재생합니다.
   */
  const handleTrackSelect = (index: number, trackId: string) => {
    console.log('[PlaylistView] 트랙 선택:', index);
    
    // 즉각적인 시각적 피드백
    setClickedTrackId(trackId);
    
    // 트랙 재생
    playerActions.playTrack(index);
    
    // 시각적 피드백 제거 (애니메이션 효과)
    setTimeout(() => {
      setClickedTrackId(null);
    }, 300);
  };

  /**
   * 빈 플레이리스트 표시
   */
  if (tracks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12 text-muted-foreground">
        <Music className="h-16 w-16 mb-4 opacity-50" />
        <p className="text-lg font-medium">플레이리스트가 비어있습니다</p>
        <p className="text-sm">상단에서 YouTube URL을 추가하세요</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[400px]">
      <div className="space-y-2 p-1">
        {tracks.map((track, index) => {
          const thumbnailUrl = track.thumbnail || getYouTubeThumbnail(track.videoId, 'mqdefault');
          const isCurrentTrack = currentIndex === index;
          const isClicked = clickedTrackId === track.id;
          const isLoadingTrack = isCurrentTrack && playerLoading;

          return (
            <div
              key={track.id}
              className={cn(
                'flex items-center gap-3 p-3 rounded-lg transition-all cursor-pointer group relative',
                'hover:shadow-md active:scale-[0.98]',
                isCurrentTrack
                  ? 'bg-primary/20 border-2 border-primary shadow-glow-primary'
                  : 'bg-card hover:bg-card/80 border border-border',
                isClicked && 'scale-[0.98] bg-primary/10'
              )}
              onClick={() => handleTrackSelect(index, track.id)}
            >
              {/* 썸네일 */}
              <div className="relative flex-shrink-0 w-16 h-16 rounded overflow-hidden bg-secondary">
                <img
                  src={thumbnailUrl}
                  alt={track.title}
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
                <div className="fallback-icon hidden absolute inset-0 flex items-center justify-center">
                  <Music className="h-8 w-8 text-primary" />
                </div>
                
                {/* 재생 중 오버레이 */}
                {isCurrentTrack && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    {isLoadingTrack ? (
                      <Loader2 className="h-6 w-6 text-white animate-spin" />
                    ) : (
                      <Play className="h-6 w-6 text-white fill-white" />
                    )}
                  </div>
                )}
              </div>

              {/* 트랙 정보 */}
              <div className="flex-1 min-w-0">
                <p className={cn(
                  'font-medium truncate transition-colors',
                  isCurrentTrack && 'text-primary font-semibold'
                )}>
                  {track.title}
                </p>
                <p className="text-sm text-muted-foreground truncate">
                  {track.videoId}
                </p>
                {isCurrentTrack && (
                  <p className="text-xs text-primary mt-1 flex items-center gap-1">
                    <span className="inline-block w-2 h-2 bg-primary rounded-full animate-pulse" />
                    재생 중
                  </p>
                )}
              </div>

              {/* 삭제 버튼 */}
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => handleDelete(track.id, e)}
                className={cn(
                  'opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0',
                  isCurrentTrack && 'opacity-100'
                )}
                title="트랙 삭제"
              >
                <Trash2 className="h-4 w-4" />
              </Button>

              {/* 클릭 효과 애니메이션 */}
              {isClicked && (
                <div className="absolute inset-0 bg-primary/10 rounded-lg animate-pulse pointer-events-none" />
              )}
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
};