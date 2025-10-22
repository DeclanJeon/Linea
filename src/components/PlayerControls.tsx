import { Button } from '@/components/ui/button';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  ListMusic,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface PlayerControlsProps {
  isPlaying: boolean;
  isShuffled: boolean;
  playbackRate: number;
  onPlayPause: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onShuffleToggle: () => void;
  onPlaybackRateChange: (rate: number) => void;
  onPlayAll: () => void; // 새로운 prop
  hasNext: boolean;
  hasPrevious: boolean;
}

export const PlayerControls = ({
  isPlaying,
  isShuffled,
  playbackRate,
  onPlayPause,
  onPrevious,
  onNext,
  onShuffleToggle,
  onPlaybackRateChange,
  onPlayAll,
  hasNext,
  hasPrevious,
}: PlayerControlsProps) => {
  return (
    <div className="bg-player-bg rounded-xl p-6 border border-border">
      {/* 플레이리스트 전체 재생 버튼 */}
      <div className="flex justify-center mb-4">
        <Button
          variant="secondary"
          onClick={onPlayAll}
          className="w-full max-w-xs"
        >
          <ListMusic className="mr-2 h-5 w-5" />
          플레이리스트 전체 재생
        </Button>
      </div>

      <div className="flex items-center justify-between mb-6">
        <Button
          variant={isShuffled ? 'default' : 'secondary'}
          size="icon"
          onClick={onShuffleToggle}
          className="rounded-full"
        >
          <Shuffle className="h-5 w-5" />
        </Button>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="icon"
            onClick={onPrevious}
            disabled={!hasPrevious}
            className="rounded-full h-12 w-12"
          >
            <SkipBack className="h-5 w-5" />
          </Button>

          <Button
            variant="default"
            size="icon"
            onClick={onPlayPause}
            className="rounded-full h-16 w-16 bg-gradient-primary hover:shadow-glow-primary transition-all"
          >
            {isPlaying ? (
              <Pause className="h-7 w-7" />
            ) : (
              <Play className="h-7 w-7 ml-1" />
            )}
          </Button>

          <Button
            variant="secondary"
            size="icon"
            onClick={onNext}
            disabled={!hasNext}
            className="rounded-full h-12 w-12"
          >
            <SkipForward className="h-5 w-5" />
          </Button>
        </div>

        <Button
          variant="secondary"
          size="icon"
          className="rounded-full"
        >
          <Repeat className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex items-center justify-center gap-3">
        <span className="text-sm text-muted-foreground">재생 속도</span>
        <Select
          value={playbackRate.toString()}
          onValueChange={(value) => onPlaybackRateChange(parseFloat(value))}
        >
          <SelectTrigger className="w-24">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0.25">0.25x</SelectItem>
            <SelectItem value="0.5">0.5x</SelectItem>
            <SelectItem value="0.75">0.75x</SelectItem>
            <SelectItem value="1">1x</SelectItem>
            <SelectItem value="1.25">1.25x</SelectItem>
            <SelectItem value="1.5">1.5x</SelectItem>
            <SelectItem value="1.75">1.75x</SelectItem>
            <SelectItem value="2">2x</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
