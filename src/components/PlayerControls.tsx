import { Button } from '@/components/ui/button';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  ListMusic,
  Loader2,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { usePlayer } from '@/contexts/PlayerContext';
import { cn } from '@/lib/utils';

/**
 * 플레이어 컨트롤 컴포넌트
 * 
 * Context를 통해 직접 상태를 관리하여 Props Drilling 제거
 */
export const PlayerControls = () => {
  const { state, actions } = usePlayer();
  const {
    tracks,
    currentIndex,
    isPlaying,
    isShuffled,
    playbackRate,
    isPlayerReady,
    isLoading,
  } = state;

  const hasNext = tracks.length > 1;
  const hasPrevious = tracks.length > 1;
  const hasAnyTracks = tracks.length > 0;

  /**
   * 재생 속도 옵션
   */
  const playbackRates = [
    { value: '0.25', label: '0.25x' },
    { value: '0.5', label: '0.5x' },
    { value: '0.75', label: '0.75x' },
    { value: '1', label: '1x (기본)' },
    { value: '1.25', label: '1.25x' },
    { value: '1.5', label: '1.5x' },
    { value: '1.75', label: '1.75x' },
    { value: '2', label: '2x' },
  ];

  return (
    <div className="bg-player-bg rounded-xl p-6 border border-border">
      {/* 전체 재생 버튼 */}
      <div className="flex justify-center mb-4">
        <Button
          variant="secondary"
          onClick={actions.playAll}
          disabled={!hasAnyTracks || isLoading}
          className="w-full max-w-xs"
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <ListMusic className="mr-2 h-5 w-5" />
          )}
          전체 재생
        </Button>
      </div>

      {/* 메인 컨트롤 */}
      <div className="flex items-center justify-between mb-6">
        {/* 셔플 버튼 */}
        <Button
          variant={isShuffled ? 'default' : 'secondary'}
          size="icon"
          onClick={actions.toggleShuffle}
          disabled={!hasAnyTracks}
          className={cn(
            'rounded-full transition-all',
            isShuffled && 'shadow-glow-primary'
          )}
          title={isShuffled ? '셔플 해제' : '셔플 재생'}
        >
          <Shuffle className="h-5 w-5" />
        </Button>

        {/* 재생 컨트롤 */}
        <div className="flex items-center gap-3">
          {/* 이전 트랙 */}
          <Button
            variant="secondary"
            size="icon"
            onClick={actions.previousTrack}
            disabled={!hasPrevious || isLoading}
            className="rounded-full h-12 w-12"
            title="이전 트랙"
          >
            <SkipBack className="h-5 w-5" />
          </Button>

          {/* 재생/일시정지 */}
          <Button
            variant="default"
            size="icon"
            onClick={actions.togglePlayPause}
            disabled={!hasAnyTracks || !isPlayerReady}
            className={cn(
              'rounded-full h-16 w-16 bg-gradient-primary transition-all',
              isPlayerReady && 'hover:shadow-glow-primary'
            )}
            title={isPlaying ? '일시정지' : '재생'}
          >
            {isLoading ? (
              <Loader2 className="h-7 w-7 animate-spin" />
            ) : isPlaying ? (
              <Pause className="h-7 w-7" />
            ) : (
              <Play className="h-7 w-7 ml-1" />
            )}
          </Button>

          {/* 다음 트랙 */}
          <Button
            variant="secondary"
            size="icon"
            onClick={actions.nextTrack}
            disabled={!hasNext || isLoading}
            className="rounded-full h-12 w-12"
            title="다음 트랙"
          >
            <SkipForward className="h-5 w-5" />
          </Button>
        </div>

        {/* 반복 재생 버튼 (향후 구현) */}
        <Button
          variant="secondary"
          size="icon"
          className="rounded-full"
          disabled
          title="반복 재생 (준비 중)"
        >
          <Repeat className="h-5 w-5" />
        </Button>
      </div>

      {/* 재생 속도 조절 */}
      <div className="flex items-center justify-center gap-3">
        <span className="text-sm text-muted-foreground min-w-[60px]">
          재생 속도
        </span>
        <Select
          value={playbackRate.toString()}
          onValueChange={(value) => actions.setPlaybackRate(parseFloat(value))}
          disabled={!isPlayerReady}
        >
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {playbackRates.map((rate) => (
              <SelectItem key={rate.value} value={rate.value}>
                {rate.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 플레이어 상태 표시 */}
      {!isPlayerReady && hasAnyTracks && (
        <div className="mt-4 text-center">
          <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            플레이어 준비 중...
          </p>
        </div>
      )}
    </div>
  );
};