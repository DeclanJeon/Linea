import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, ListPlus, Loader2 } from 'lucide-react';
import { Track, extractVideoId } from '@/lib/db';
import { usePlaylist } from '@/contexts/PlaylistContext';
import { toast } from '@/hooks/use-toast';

/**
 * AddTrackForm 컴포넌트
 * 
 * 단일 또는 다중 트랙 추가 기능을 제공합니다.
 * 재생 중에도 트랙을 추가할 수 있습니다.
 */
export const AddTrackForm = () => {
  const { currentPlaylistId, addTrack } = usePlaylist();
  
  const [singleUrl, setSingleUrl] = useState('');
  const [multipleUrls, setMultipleUrls] = useState('');
  const [isMultiMode, setIsMultiMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * 단일 트랙 추가
   */
  const handleAddSingle = async () => {
    if (!singleUrl.trim() || isSubmitting) return;

    const videoId = extractVideoId(singleUrl);
    if (!videoId) {
      toast({
        title: '잘못된 URL',
        description: '올바른 YouTube URL을 입력하세요.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    const track: Track = {
      id: `${Date.now()}-${Math.random()}`,
      playlistId: currentPlaylistId,
      url: singleUrl,
      title: `Track ${videoId}`,
      videoId,
      addedAt: Date.now(),
    };

    try {
      await addTrack(track);
      setSingleUrl('');
    } catch (error) {
      console.error('트랙 추가 실패:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * 다중 트랙 추가
   */
  const handleAddMultiple = async () => {
    if (isSubmitting) return;

    const urls = multipleUrls
      .split('\n')
      .map(url => url.trim())
      .filter(url => url.length > 0);

    if (urls.length === 0) return;

    setIsSubmitting(true);

    let successCount = 0;
    let failCount = 0;

    for (const url of urls) {
      const videoId = extractVideoId(url);
      if (!videoId) {
        failCount++;
        continue;
      }

      const track: Track = {
        id: `${Date.now()}-${Math.random()}`,
        playlistId: currentPlaylistId,
        url,
        title: `Track ${videoId}`,
        videoId,
        addedAt: Date.now(),
      };

      try {
        await addTrack(track);
        successCount++;
        await new Promise(resolve => setTimeout(resolve, 50));
      } catch {
        failCount++;
      }
    }

    setMultipleUrls('');
    setIsSubmitting(false);

    toast({
      title: '추가 완료',
      description: `${successCount}개 성공, ${failCount}개 실패`,
    });
  };

  /**
   * Enter 키 처리
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddSingle();
    }
  };

  return (
    <div className="space-y-4">
      {/* 모드 전환 버튼 */}
      <div className="flex gap-2">
        <Button
          variant={!isMultiMode ? 'default' : 'secondary'}
          onClick={() => setIsMultiMode(false)}
          disabled={isSubmitting}
          className="flex-1"
        >
          <Plus className="mr-2 h-4 w-4" />
          단일 추가
        </Button>
        <Button
          variant={isMultiMode ? 'default' : 'secondary'}
          onClick={() => setIsMultiMode(true)}
          disabled={isSubmitting}
          className="flex-1"
        >
          <ListPlus className="mr-2 h-4 w-4" />
          다중 추가
        </Button>
      </div>

      {/* 단일 추가 모드 */}
      {!isMultiMode ? (
        <div className="flex gap-2">
          <Input
            placeholder="YouTube URL 입력..."
            value={singleUrl}
            onChange={(e) => setSingleUrl(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isSubmitting}
            className="flex-1"
          />
          <Button 
            onClick={handleAddSingle} 
            disabled={isSubmitting || !singleUrl.trim()}
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              '추가'
            )}
          </Button>
        </div>
      ) : (
        /* 다중 추가 모드 */
        <div className="space-y-2">
          <Textarea
            placeholder="YouTube URL을 한 줄에 하나씩 입력..."
            value={multipleUrls}
            onChange={(e) => setMultipleUrls(e.target.value)}
            disabled={isSubmitting}
            rows={6}
            className="resize-none"
          />
          <Button 
            onClick={handleAddMultiple} 
            disabled={isSubmitting || !multipleUrls.trim()}
            className="w-full"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                추가 중...
              </>
            ) : (
              '모두 추가'
            )}
          </Button>
        </div>
      )}
      
      {/* 안내 메시지 */}
      {!isSubmitting && (
        <p className="text-xs text-muted-foreground text-center">
          {isMultiMode 
            ? '재생 중에도 트랙을 추가할 수 있습니다. 현재 재생은 계속됩니다.' 
            : '재생 중에도 트랙을 추가할 수 있습니다.'}
        </p>
      )}
    </div>
  );
};