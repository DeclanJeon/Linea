import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import {
  Playlist,
  Track,
  getAllPlaylists,
  createPlaylist as createPlaylistDB,
  updatePlaylist as updatePlaylistDB,
  deletePlaylist as deletePlaylistDB,
  getTracksByPlaylist,
  addTrack as addTrackDB,
  deleteTrack as deleteTrackDB,
  updateTrack as updateTrackDB,
  getCurrentPlaylistId,
  setCurrentPlaylistId,
  initDB,
} from '@/lib/db';
import { usePlayer } from '@/contexts/PlayerContext';
import { toast } from '@/hooks/use-toast';

/**
 * PlaylistContext 인터페이스
 */
interface PlaylistContextType {
  playlists: Playlist[];
  currentPlaylistId: string;
  currentPlaylist: Playlist | null;
  tracks: Track[];
  isLoading: boolean;
  error: string | null;
  createPlaylist: (name: string) => Promise<Playlist | null>;
  updatePlaylist: (playlist: Playlist) => Promise<void>;
  deletePlaylist: (playlistId: string) => Promise<void>;
  switchPlaylist: (playlistId: string) => Promise<void>;
  addTrack: (track: Track) => Promise<void>;
  deleteTrack: (trackId: string) => Promise<void>;
  updateTrack: (track: Track) => Promise<void>;
  refreshCurrentPlaylist: () => Promise<void>;
}

const PlaylistContext = createContext<PlaylistContextType | undefined>(undefined);

/**
 * PlaylistProvider 컴포넌트
 */
export const PlaylistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { actions: playerActions } = usePlayer();
  
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [currentPlaylistId, setCurrentPlaylistIdState] = useState<string>('default');
  const [currentPlaylist, setCurrentPlaylist] = useState<Playlist | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isInitialLoadRef = useRef(true);

  /**
   * 초기 데이터 로딩
   */
  useEffect(() => {
    const initialize = async () => {
      try {
        setIsLoading(true);
        setError(null);

        await initDB();
        
        const [loadedPlaylists, savedPlaylistId] = await Promise.all([
          getAllPlaylists(),
          getCurrentPlaylistId(),
        ]);

        console.log('[PlaylistContext] 초기화 완료:', {
          playlists: loadedPlaylists.length,
          currentPlaylistId: savedPlaylistId,
        });

        setPlaylists(loadedPlaylists);

        const playlistExists = loadedPlaylists.some(p => p.id === savedPlaylistId);
        const playlistIdToUse = playlistExists ? savedPlaylistId : loadedPlaylists[0]?.id || 'default';

        await loadPlaylist(playlistIdToUse);
        isInitialLoadRef.current = false;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '플레이리스트 초기화 실패';
        console.error('[PlaylistContext] 초기화 에러:', err);
        setError(errorMessage);
        toast({
          title: '초기화 실패',
          description: errorMessage,
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    initialize();
  }, []);

  /**
   * 플레이리스트 로드
   */
  const loadPlaylist = useCallback(async (playlistId: string) => {
    try {
      console.log('[PlaylistContext] 플레이리스트 로드:', playlistId);
      
      const [loadedTracks, loadedPlaylists] = await Promise.all([
        getTracksByPlaylist(playlistId),
        getAllPlaylists(),
      ]);

      const playlist = loadedPlaylists.find(p => p.id === playlistId) || null;

      setCurrentPlaylistIdState(playlistId);
      setCurrentPlaylist(playlist);
      setTracks(loadedTracks);
      
      // 초기 로드 시에만 setTracks, 이후에는 updateTracks 사용
      if (isInitialLoadRef.current) {
        playerActions.setTracks(loadedTracks);
      } else {
        playerActions.updateTracks(loadedTracks);
      }

      await setCurrentPlaylistId(playlistId);

      console.log('[PlaylistContext] 플레이리스트 로드 완료:', {
        playlistId,
        tracksCount: loadedTracks.length,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '플레이리스트 로드 실패';
      console.error('[PlaylistContext] 로드 에러:', err);
      setError(errorMessage);
      throw err;
    }
  }, [playerActions]);

  /**
   * 현재 플레이리스트 새로고침
   */
  const refreshCurrentPlaylist = useCallback(async () => {
    try {
      console.log('[PlaylistContext] 플레이리스트 새로고침:', currentPlaylistId);
      
      const loadedTracks = await getTracksByPlaylist(currentPlaylistId);
      
      setTracks(loadedTracks);
      
      // 재생 중인 경우 updateTracks 사용하여 현재 트랙 유지
      playerActions.updateTracks(loadedTracks);
      
      console.log('[PlaylistContext] 플레이리스트 새로고침 완료:', {
        tracksCount: loadedTracks.length,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '플레이리스트 새로고침 실패';
      console.error('[PlaylistContext] 새로고침 에러:', err);
      setError(errorMessage);
    }
  }, [currentPlaylistId, playerActions]);

  /**
   * 플레이리스트 생성
   */
  const createPlaylist = useCallback(async (name: string): Promise<Playlist | null> => {
    try {
      console.log('[PlaylistContext] 플레이리스트 생성:', name);
      
      const newPlaylist = await createPlaylistDB(name);
      const updatedPlaylists = await getAllPlaylists();
      
      setPlaylists(updatedPlaylists);
      
      toast({
        title: '플레이리스트 생성됨',
        description: `"${name}" 플레이리스트가 생성되었습니다.`,
      });

      return newPlaylist;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '플레이리스트 생성 실패';
      console.error('[PlaylistContext] 생성 에러:', err);
      setError(errorMessage);
      toast({
        title: '생성 실패',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    }
  }, []);

  /**
   * 플레이리스트 업데이트
   */
  const updatePlaylist = useCallback(async (playlist: Playlist): Promise<void> => {
    try {
      console.log('[PlaylistContext] 플레이리스트 업데이트:', playlist.id);
      
      await updatePlaylistDB(playlist);
      const updatedPlaylists = await getAllPlaylists();
      
      setPlaylists(updatedPlaylists);
      
      if (playlist.id === currentPlaylistId) {
        setCurrentPlaylist(playlist);
      }

      toast({
        title: '플레이리스트 업데이트됨',
        description: `"${playlist.name}" 플레이리스트가 업데이트되었습니다.`,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '플레이리스트 업데이트 실패';
      console.error('[PlaylistContext] 업데이트 에러:', err);
      setError(errorMessage);
      toast({
        title: '업데이트 실패',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  }, [currentPlaylistId]);

  /**
   * 플레이리스트 삭제
   */
  const deletePlaylist = useCallback(async (playlistId: string): Promise<void> => {
    try {
      console.log('[PlaylistContext] 플레이리스트 삭제:', playlistId);
      
      await deletePlaylistDB(playlistId);
      const updatedPlaylists = await getAllPlaylists();
      
      setPlaylists(updatedPlaylists);

      if (playlistId === currentPlaylistId) {
        const firstPlaylist = updatedPlaylists[0];
        if (firstPlaylist) {
          await loadPlaylist(firstPlaylist.id);
        } else {
          setCurrentPlaylistIdState('default');
          setCurrentPlaylist(null);
          setTracks([]);
          playerActions.updateTracks([]);
        }
      }

      toast({
        title: '플레이리스트 삭제됨',
        description: '플레이리스트가 삭제되었습니다.',
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '플레이리스트 삭제 실패';
      console.error('[PlaylistContext] 삭제 에러:', err);
      setError(errorMessage);
      toast({
        title: '삭제 실패',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  }, [currentPlaylistId, loadPlaylist, playerActions]);

  /**
   * 플레이리스트 전환
   */
  const switchPlaylist = useCallback(async (playlistId: string): Promise<void> => {
    try {
      console.log('[PlaylistContext] 플레이리스트 전환:', playlistId);
      await loadPlaylist(playlistId);
      
      toast({
        title: '플레이리스트 전환됨',
        description: '새 플레이리스트로 전환되었습니다.',
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '플레이리스트 전환 실패';
      console.error('[PlaylistContext] 전환 에러:', err);
      setError(errorMessage);
      toast({
        title: '전환 실패',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  }, [loadPlaylist]);

  /**
   * 트랙 추가
   */
  const addTrack = useCallback(async (track: Track): Promise<void> => {
    try {
      console.log('[PlaylistContext] 트랙 추가:', track.videoId);
      
      await addTrackDB(track);
      
      // 재생을 유지하면서 트랙 목록만 업데이트
      await refreshCurrentPlaylist();

      toast({
        title: '트랙 추가됨',
        description: `트랙이 플레이리스트에 추가되었습니다.`,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '트랙 추가 실패';
      console.error('[PlaylistContext] 트랙 추가 에러:', err);
      setError(errorMessage);
      toast({
        title: '추가 실패',
        description: errorMessage,
        variant: 'destructive',
      });
      throw err;
    }
  }, [refreshCurrentPlaylist]);

  /**
   * 트랙 삭제
   */
  const deleteTrack = useCallback(async (trackId: string): Promise<void> => {
    try {
      console.log('[PlaylistContext] 트랙 삭제:', trackId);
      
      await deleteTrackDB(trackId);
      
      // 재생을 유지하면서 트랙 목록만 업데이트
      await refreshCurrentPlaylist();

      toast({
        title: '트랙 삭제됨',
        description: '트랙이 삭제되었습니다.',
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '트랙 삭제 실패';
      console.error('[PlaylistContext] 트랙 삭제 에러:', err);
      setError(errorMessage);
      toast({
        title: '삭제 실패',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  }, [refreshCurrentPlaylist]);

  /**
   * 트랙 업데이트
   */
  const updateTrack = useCallback(async (track: Track): Promise<void> => {
    try {
      console.log('[PlaylistContext] 트랙 업데이트:', track.id);
      
      await updateTrackDB(track);
      
      // 로컬 상태 업데이트
      setTracks(prevTracks => 
        prevTracks.map(t => t.id === track.id ? track : t)
      );

      // 플레이어 상태도 업데이트
      const trackIndex = tracks.findIndex(t => t.id === track.id);
      if (trackIndex !== -1 && track.title && track.thumbnail) {
        playerActions.updateTrackMetadata(trackIndex, {
          title: track.title,
          thumbnail: track.thumbnail,
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '트랙 업데이트 실패';
      console.error('[PlaylistContext] 트랙 업데이트 에러:', err);
      setError(errorMessage);
    }
  }, [tracks, playerActions]);

  const contextValue: PlaylistContextType = {
    playlists,
    currentPlaylistId,
    currentPlaylist,
    tracks,
    isLoading,
    error,
    createPlaylist,
    updatePlaylist,
    deletePlaylist,
    switchPlaylist,
    addTrack,
    deleteTrack,
    updateTrack,
    refreshCurrentPlaylist,
  };

  return (
    <PlaylistContext.Provider value={contextValue}>
      {children}
    </PlaylistContext.Provider>
  );
};

/**
 * usePlaylist 훅
 */
export const usePlaylist = (): PlaylistContextType => {
  const context = useContext(PlaylistContext);
  if (!context) {
    throw new Error('usePlaylist은 PlaylistProvider 내부에서 사용되어야 합니다.');
  }
  return context;
};