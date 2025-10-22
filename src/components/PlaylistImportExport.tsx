import { useRef } from 'react';
import { exportPlaylist, importPlaylist } from '@/lib/playlist-utils';
import { Button } from '@/components/ui/button';
import { Download, Upload, Loader2 } from 'lucide-react';
import { usePlaylist } from '@/contexts/PlaylistContext';
import { toast } from '@/hooks/use-toast';
import { Track, addTrack } from '@/lib/db';
import { useState } from 'react';

/**
 * 플레이리스트 Import/Export 컴포넌트
 * 
 * Context를 통해 직접 플레이리스트 관리
 */
export const PlaylistImportExport = () => {
  const { currentPlaylist, tracks, currentPlaylistId, refreshCurrentPlaylist } = usePlaylist();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);

  /**
   * Export 핸들러
   */
  const handleExport = () => {
    if (!currentPlaylist) return;

    try {
      exportPlaylist(currentPlaylist, tracks);
      toast({
        title: '내보내기 완료',
        description: '플레이리스트가 다운로드되었습니다.',
      });
    } catch (error) {
      toast({
        title: '내보내기 실패',
        description: '플레이리스트를 내보내는 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    }
  };

  /**
   * Import 클릭 핸들러
   */
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  /**
   * Import 핸들러
   */
  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);

    try {
      const data = await importPlaylist(file);

      // 현재 플레이리스트에 트랙 추가
      for (const track of data.tracks) {
        const newTrack: Track = {
          ...track,
          id: `${Date.now()}-${Math.random()}`,
          playlistId: currentPlaylistId,
          addedAt: Date.now(),
        };
        await addTrack(newTrack);
        // 각 트랙 추가 사이에 약간의 지연 (DB 부하 방지)
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      await refreshCurrentPlaylist();

      toast({
        title: '가져오기 완료',
        description: `${data.tracks.length}개의 트랙을 가져왔습니다.`,
      });
    } catch (error) {
      toast({
        title: '가져오기 실패',
        description: '플레이리스트를 가져오는 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsImporting(false);
      // 파일 입력 리셋
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="flex gap-2">
      <Button 
        variant="secondary" 
        onClick={handleExport} 
        disabled={tracks.length === 0}
        className="flex-1"
      >
        <Download className="mr-2 h-4 w-4" />
        내보내기
      </Button>
      <Button 
        variant="secondary" 
        onClick={handleImportClick} 
        disabled={isImporting}
        className="flex-1"
      >
        {isImporting ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Upload className="mr-2 h-4 w-4" />
        )}
        가져오기
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleImport}
        className="hidden"
      />
    </div>
  );
};