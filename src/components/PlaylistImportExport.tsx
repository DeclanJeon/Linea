import { useRef } from 'react';
import { Playlist, Track, addTrack } from '@/lib/db';
import { exportPlaylist, importPlaylist } from '@/lib/playlist-utils';
import { Button } from '@/components/ui/button';
import { Download, Upload } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface PlaylistImportExportProps {
  currentPlaylist: Playlist;
  tracks: Track[];
  onImportComplete: () => void;
}

export const PlaylistImportExport = ({
  currentPlaylist,
  tracks,
  onImportComplete,
}: PlaylistImportExportProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    try {
      exportPlaylist(currentPlaylist, tracks);
      toast({
        title: '내보내기 완료',
        description: '플레이리스트가 다운로드되었습니다.',
      });
    } catch (error) {
      toast({
        title: '오류',
        description: '플레이리스트 내보내기 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const data = await importPlaylist(file);
      
      // Import tracks to current playlist
      for (const track of data.tracks) {
        const newTrack: Track = {
          ...track,
          id: `${Date.now()}-${Math.random()}`,
          playlistId: currentPlaylist.id,
          addedAt: Date.now(),
        };
        await addTrack(newTrack);
      }

      onImportComplete();
      toast({
        title: '가져오기 완료',
        description: `${data.tracks.length}개의 트랙을 가져왔습니다.`,
      });
    } catch (error) {
      toast({
        title: '오류',
        description: '플레이리스트 가져오기 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex gap-2">
      <Button variant="secondary" onClick={handleExport} className="flex-1">
        <Download className="mr-2 h-4 w-4" />
        내보내기
      </Button>
      <Button variant="secondary" onClick={handleImportClick} className="flex-1">
        <Upload className="mr-2 h-4 w-4" />
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
