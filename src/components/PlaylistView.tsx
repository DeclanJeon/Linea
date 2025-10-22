import { Track, deleteTrack } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trash2, Music, Play } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { getYouTubeThumbnail } from '@/lib/utils';

interface PlaylistViewProps {
  tracks: Track[];
  currentIndex: number;
  onTrackSelect: (index: number) => void;
  onTracksChanged: () => void;
}

export const PlaylistView = ({
  tracks,
  currentIndex,
  onTrackSelect,
  onTracksChanged,
}: PlaylistViewProps) => {
  const handleDelete = async (track: Track) => {
    try {
      await deleteTrack(track.id);
      onTracksChanged();
      toast({
        title: '삭제 완료',
        description: '트랙이 삭제되었습니다.',
      });
    } catch (error) {
      toast({
        title: '오류',
        description: '트랙을 삭제하는 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    }
  };

  if (tracks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12 text-muted-foreground">
        <Music className="h-16 w-16 mb-4 opacity-50" />
        <p>플레이리스트가 비어있습니다</p>
        <p className="text-sm">위에서 YouTube 링크를 추가해보세요</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[400px]">
      <div className="space-y-2 p-1">
        {tracks.map((track, index) => {
          const thumbnailUrl = track.thumbnail || getYouTubeThumbnail(track.videoId, 'mqdefault');
          const isCurrentTrack = currentIndex === index;

          return (
            <div
              key={track.id}
              className={`flex items-center gap-3 p-3 rounded-lg transition-all cursor-pointer group ${
                isCurrentTrack
                  ? 'bg-primary/20 border-2 border-primary shadow-glow-primary'
                  : 'bg-card hover:bg-card/80 border border-border'
              }`}
              onClick={() => onTrackSelect(index)}
            >
              {/* 썸네일 */}
              <div className="relative flex-shrink-0 w-16 h-16 rounded overflow-hidden bg-secondary">
                <img
                  src={thumbnailUrl}
                  alt={track.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // 썸네일 로드 실패 시 폴백
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                  }}
                />
                <div className="hidden absolute inset-0 flex items-center justify-center">
                  <Music className="h-8 w-8 text-primary" />
                </div>
                {isCurrentTrack && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <Play className="h-6 w-6 text-white fill-white" />
                  </div>
                )}
              </div>

              {/* 트랙 정보 */}
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{track.title}</p>
                <p className="text-sm text-muted-foreground truncate">{track.videoId}</p>
              </div>

              {/* 삭제 버튼 */}
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(track);
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
};
