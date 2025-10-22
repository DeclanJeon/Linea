import { useEffect, useState, useCallback } from 'react';
import {
  Track,
  Playlist,
  getTracksByPlaylist,
  getAllPlaylists,
  getCurrentPlaylistId,
  setCurrentPlaylistId,
  initDB,
  updateTrack
} from '@/lib/db';
import { YouTubePlayer } from '@/components/YouTubePlayer';
import { AddTrackForm } from '@/components/AddTrackForm';
import { PlaylistView } from '@/components/PlaylistView';
import { PlayerControls } from '@/components/PlayerControls';
import { PlaylistManager } from '@/components/PlaylistManager';
import { PlaylistImportExport } from '@/components/PlaylistImportExport';
import { Music2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const Index = () => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [currentPlaylistId, setCurrentPlaylistIdState] = useState<string>('default');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);

  useEffect(() => {
    initDB().then(async () => {
      const playlistId = await getCurrentPlaylistId();
      setCurrentPlaylistIdState(playlistId);
      await loadPlaylists();
      await loadTracks(playlistId);
    });
  }, []);

  const loadPlaylists = async () => {
    const allPlaylists = await getAllPlaylists();
    setPlaylists(allPlaylists);
  };

  const loadTracks = async (playlistId: string) => {
    const playlistTracks = await getTracksByPlaylist(playlistId);
    setTracks(playlistTracks);
    setCurrentIndex(0);
  };

  const handlePlaylistChange = async (playlistId: string) => {
    setCurrentPlaylistIdState(playlistId);
    await setCurrentPlaylistId(playlistId);
    await loadTracks(playlistId);
    setIsPlaying(false);
  };

  const handleTrackEnd = () => {
    if (isShuffled) {
      const nextIndex = Math.floor(Math.random() * tracks.length);
      setCurrentIndex(nextIndex);
    } else if (currentIndex < tracks.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // 플레이리스트 끝에 도달하면 재생 중지
      setIsPlaying(false);
      setCurrentIndex(0);
    }
  };

  const handleNext = () => {
    if (isShuffled) {
      const nextIndex = Math.floor(Math.random() * tracks.length);
      setCurrentIndex(nextIndex);
    } else if (currentIndex < tracks.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setCurrentIndex(0);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else {
      setCurrentIndex(tracks.length - 1);
    }
  };

  /**
   * 비디오 메타데이터(제목, 썸네일)를 업데이트합니다.
   */
  const handleTrackMetadataUpdate = useCallback(async (
    index: number,
    metadata: { title: string; thumbnail: string }
  ) => {
    const track = tracks[index];
    if (!track) return;

    // 제목이나 썸네일이 변경된 경우에만 업데이트
    if (track.title !== metadata.title || track.thumbnail !== metadata.thumbnail) {
      const updatedTrack: Track = {
        ...track,
        title: metadata.title,
        thumbnail: metadata.thumbnail,
      };

      try {
        await updateTrack(updatedTrack);
        // UI 즉시 업데이트
        setTracks(prev => prev.map((t, i) => i === index ? updatedTrack : t));
        console.log(`✅ 메타데이터 업데이트: ${metadata.title}`);
      } catch (error) {
        console.error('메타데이터 업데이트 실패:', error);
      }
    }
  }, [tracks]);

  /**
   * 플레이리스트 전체를 처음부터 재생합니다.
   */
  const handlePlayAll = () => {
    if (tracks.length === 0) {
      toast({
        title: '플레이리스트가 비어있습니다',
        description: '재생할 트랙을 추가해주세요.',
        variant: 'destructive',
      });
      return;
    }

    setCurrentIndex(0);
    setIsPlaying(true);
    toast({
      title: '플레이리스트 재생 시작',
      description: `${tracks.length}개의 트랙을 연속 재생합니다.`,
    });
  };

  const currentTrack = tracks[currentIndex];
  const currentPlaylist = playlists.find(p => p.id === currentPlaylistId);

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

        {/* Playlist Manager */}
        <div className="bg-card rounded-xl p-6 border border-border mb-6">
          <h2 className="text-xl font-semibold mb-4">플레이리스트 관리</h2>
          <div className="space-y-3">
            <PlaylistManager
              playlists={playlists}
              currentPlaylistId={currentPlaylistId}
              onPlaylistChange={handlePlaylistChange}
              onPlaylistsChanged={loadPlaylists}
            />
            {currentPlaylist && (
              <PlaylistImportExport
                currentPlaylist={currentPlaylist}
                tracks={tracks}
                onImportComplete={() => loadTracks(currentPlaylistId)}
              />
            )}
          </div>
        </div>

        {/* Add Track Form */}
        <div className="bg-card rounded-xl p-6 border border-border mb-6">
          <h2 className="text-xl font-semibold mb-4">트랙 추가</h2>
          <AddTrackForm
            playlistId={currentPlaylistId}
            onTrackAdded={() => loadTracks(currentPlaylistId)}
          />
        </div>

        {/* Current Playing */}
        {currentTrack && (
          <div className="bg-card rounded-xl p-6 border border-border mb-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-20 h-20 rounded-lg overflow-hidden bg-gradient-accent shadow-glow-accent">
                {currentTrack.thumbnail ? (
                  <img
                    src={currentTrack.thumbnail}
                    alt={currentTrack.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Music2 className="h-10 w-10 text-white" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-1">재생 중</p>
                <h3 className="text-xl font-semibold">{currentTrack.title}</h3>
                <p className="text-sm text-muted-foreground">{currentTrack.videoId}</p>
              </div>
            </div>

            <PlayerControls
              isPlaying={isPlaying}
              isShuffled={isShuffled}
              playbackRate={playbackRate}
              onPlayPause={() => setIsPlaying(!isPlaying)}
              onPrevious={handlePrevious}
              onNext={handleNext}
              onShuffleToggle={() => setIsShuffled(!isShuffled)}
              onPlaybackRateChange={setPlaybackRate}
              onPlayAll={handlePlayAll}
              hasNext={tracks.length > 1}
              hasPrevious={tracks.length > 1}
            />
          </div>
        )}

        {/* Playlist */}
        <div className="bg-card rounded-xl p-6 border border-border">
          <h2 className="text-xl font-semibold mb-4">
            플레이리스트 ({tracks.length})
          </h2>
          <PlaylistView
            tracks={tracks}
            currentIndex={currentIndex}
            onTrackSelect={(index) => {
              setCurrentIndex(index);
              setIsPlaying(true);
            }}
            onTracksChanged={() => loadTracks(currentPlaylistId)}
          />
        </div>
      </div>

      {/* YouTube Player (hidden) */}
      <YouTubePlayer
        tracks={tracks}
        currentIndex={currentIndex}
        isPlaying={isPlaying}
        playbackRate={playbackRate}
        isShuffled={isShuffled}
        onTrackEnd={handleTrackEnd}
        onPlayPause={setIsPlaying}
        onTrackMetadataUpdate={handleTrackMetadataUpdate}
      />
    </div>
  );
};

export default Index;
