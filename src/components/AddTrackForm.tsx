import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, ListPlus } from 'lucide-react';
import { Track, addTrack, extractVideoId } from '@/lib/db';
import { toast } from '@/hooks/use-toast';

interface AddTrackFormProps {
  playlistId: string;
  onTrackAdded: () => void;
}

export const AddTrackForm = ({ playlistId, onTrackAdded }: AddTrackFormProps) => {
  const [singleUrl, setSingleUrl] = useState('');
  const [multipleUrls, setMultipleUrls] = useState('');
  const [isMultiMode, setIsMultiMode] = useState(false);

  const handleAddSingle = async () => {
    if (!singleUrl.trim()) return;

    const videoId = extractVideoId(singleUrl);
    if (!videoId) {
      toast({
        title: '오류',
        description: '유효한 YouTube URL을 입력해주세요.',
        variant: 'destructive',
      });
      return;
    }

    const track: Track = {
      id: `${Date.now()}-${Math.random()}`,
      playlistId,
      url: singleUrl,
      title: `Track ${videoId}`,
      videoId,
      addedAt: Date.now(),
    };

    try {
      await addTrack(track);
      setSingleUrl('');
      onTrackAdded();
      toast({
        title: '추가됨',
        description: '트랙이 플레이리스트에 추가되었습니다.',
      });
    } catch (error) {
      toast({
        title: '오류',
        description: '트랙 추가 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    }
  };

  const handleAddMultiple = async () => {
    const urls = multipleUrls
      .split('\n')
      .map(url => url.trim())
      .filter(url => url.length > 0);

    if (urls.length === 0) return;

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
        playlistId,
        url,
        title: `Track ${videoId}`,
        videoId,
        addedAt: Date.now(),
      };

      try {
        await addTrack(track);
        successCount++;
      } catch {
        failCount++;
      }
    }

    setMultipleUrls('');
    onTrackAdded();
    
    toast({
      title: '완료',
      description: `${successCount}개 추가, ${failCount}개 실패`,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button
          variant={!isMultiMode ? 'default' : 'secondary'}
          onClick={() => setIsMultiMode(false)}
          className="flex-1"
        >
          <Plus className="mr-2 h-4 w-4" />
          단일 추가
        </Button>
        <Button
          variant={isMultiMode ? 'default' : 'secondary'}
          onClick={() => setIsMultiMode(true)}
          className="flex-1"
        >
          <ListPlus className="mr-2 h-4 w-4" />
          다중 추가
        </Button>
      </div>

      {!isMultiMode ? (
        <div className="flex gap-2">
          <Input
            placeholder="YouTube URL 입력..."
            value={singleUrl}
            onChange={(e) => setSingleUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddSingle()}
            className="flex-1"
          />
          <Button onClick={handleAddSingle}>추가</Button>
        </div>
      ) : (
        <div className="space-y-2">
          <Textarea
            placeholder="YouTube URL을 한 줄에 하나씩 입력하세요..."
            value={multipleUrls}
            onChange={(e) => setMultipleUrls(e.target.value)}
            rows={6}
            className="resize-none"
          />
          <Button onClick={handleAddMultiple} className="w-full">
            모두 추가
          </Button>
        </div>
      )}
    </div>
  );
};
