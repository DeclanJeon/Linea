import { useEffect, useRef, useCallback } from 'react';
import { usePlayer } from '@/contexts/PlayerContext';
import { usePlaylist } from '@/contexts/PlaylistContext';
import { getYouTubeThumbnail } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

/**
 * YouTube Player 상태 열거형
 */
enum PlayerState {
  UNSTARTED = -1,
  ENDED = 0,
  PLAYING = 1,
  PAUSED = 2,
  BUFFERING = 3,
  CUED = 5,
}

/**
 * YouTubePlayer 컴포넌트
 * 
 * YouTube IFrame API를 사용하여 비디오를 재생합니다.
 * 플레이어를 재사용하여 불필요한 재초기화를 방지합니다.
 */
export const YouTubePlayer = () => {
  const { state: playerState, actions: playerActions } = usePlayer();
  const { updateTrack } = usePlaylist();
  
  const playerRef = useRef<any>(null);
  const isAPIReadyRef = useRef(false);
  const retryCountRef = useRef(0);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentVideoIdRef = useRef<string | null>(null);
  const metadataExtractedRef = useRef<Set<string>>(new Set());
  const metadataRetryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const MAX_RETRY = 3;
  const METADATA_RETRY_DELAY = 1500;
  const METADATA_MAX_RETRIES = 3;

  const { tracks, currentIndex, isPlaying, playbackRate, isPlayerReady } = playerState;
  const currentTrack = tracks[currentIndex];

  /**
   * 메타데이터 추출 및 업데이트
   */
  const extractAndUpdateMetadata = useCallback(async (retryCount = 0) => {
    // 이전 재시도 타임아웃 클리어
    if (metadataRetryTimeoutRef.current) {
      clearTimeout(metadataRetryTimeoutRef.current);
      metadataRetryTimeoutRef.current = null;
    }

    if (!playerRef.current || typeof playerRef.current.getVideoData !== 'function') {
      console.warn('[YouTubePlayer] 플레이어가 준비되지 않음');
      return;
    }

    if (!currentTrack) {
      console.warn('[YouTubePlayer] 현재 트랙이 없음');
      return;
    }

    // 이미 메타데이터를 추출한 경우 스킵
    if (metadataExtractedRef.current.has(currentTrack.videoId)) {
      console.log('[YouTubePlayer] 메타데이터 이미 추출됨:', currentTrack.videoId);
      return;
    }

    try {
      const videoData = playerRef.current.getVideoData();
      
      if (!videoData || !videoData.title || videoData.title === '' || !videoData.video_id) {
        if (retryCount < METADATA_MAX_RETRIES) {
          console.log(`[YouTubePlayer] 메타데이터 재시도 (${retryCount + 1}/${METADATA_MAX_RETRIES})`);
          metadataRetryTimeoutRef.current = setTimeout(() => {
            extractAndUpdateMetadata(retryCount + 1);
          }, METADATA_RETRY_DELAY * (retryCount + 1));
          return;
        }
        console.warn('[YouTubePlayer] 메타데이터 추출 실패 (최대 재시도 초과)');
        return;
      }

      const title = videoData.title;
      const thumbnail = getYouTubeThumbnail(videoData.video_id, 'maxresdefault');
      
      // 이미 올바른 메타데이터를 가지고 있는 경우 스킵
      if (currentTrack.title === title && currentTrack.thumbnail === thumbnail) {
        metadataExtractedRef.current.add(currentTrack.videoId);
        console.log('[YouTubePlayer] 메타데이터가 이미 최신 상태:', title);
        return;
      }

      console.log('[YouTubePlayer] 메타데이터 추출 성공:', { title, videoId: videoData.video_id });

      const updatedTrack = {
        ...currentTrack,
        title,
        thumbnail,
      };

      // DB 업데이트 (비동기로 처리하되 에러는 무시)
      updateTrack(updatedTrack).catch(err => {
        console.warn('[YouTubePlayer] DB 업데이트 실패 (무시됨):', err);
      });

      // Context 상태 업데이트
      playerActions.updateTrackMetadata(currentIndex, { title, thumbnail });

      // 추출 완료 표시
      metadataExtractedRef.current.add(currentTrack.videoId);

      console.log('[YouTubePlayer] 메타데이터 업데이트 완료:', title);
    } catch (error) {
      console.error('[YouTubePlayer] 메타데이터 추출 에러:', error);
      
      if (retryCount < METADATA_MAX_RETRIES) {
        metadataRetryTimeoutRef.current = setTimeout(() => {
          extractAndUpdateMetadata(retryCount + 1);
        }, METADATA_RETRY_DELAY * (retryCount + 1));
      }
    }
  }, [currentTrack, currentIndex, updateTrack, playerActions]);

  /**
   * YouTube Player 이벤트 핸들러
   */
  const handlePlayerReady = useCallback((event: any) => {
    console.log('[YouTubePlayer] Player 준비 완료');
    playerActions.setPlayerReady(true);
    playerActions.setError(null);
    playerActions.setLoading(false);
    
    // 준비 완료 후 메타데이터 추출 시도
    setTimeout(() => extractAndUpdateMetadata(), 1000);
  }, [playerActions, extractAndUpdateMetadata]);

  const handleStateChange = useCallback((event: any) => {
    const state = event.data;
    console.log('[YouTubePlayer] 상태 변경:', state);

    // 로딩 타임아웃 클리어
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }

    switch (state) {
      case PlayerState.ENDED:
        console.log('[YouTubePlayer] 재생 종료');
        playerActions.nextTrack();
        break;

      case PlayerState.PLAYING:
        console.log('[YouTubePlayer] 재생 중');
        playerActions.setPlayerReady(true);
        playerActions.setLoading(false);
        playerActions.setError(null);
        retryCountRef.current = 0;
        
        // 재생 시작 시 메타데이터 추출 (약간의 지연 후)
        setTimeout(() => extractAndUpdateMetadata(), 1500);
        break;

      case PlayerState.PAUSED:
        console.log('[YouTubePlayer] 일시정지');
        playerActions.setLoading(false);
        break;

      case PlayerState.BUFFERING:
        console.log('[YouTubePlayer] 버퍼링');
        playerActions.setLoading(true);
        
        // 버퍼링 타임아웃 설정 (20초로 증가)
        loadingTimeoutRef.current = setTimeout(() => {
          console.warn('[YouTubePlayer] 버퍼링 타임아웃');
          playerActions.setError('비디오 로딩이 지연되고 있습니다.');
        }, 20000);
        break;

      case PlayerState.CUED:
        console.log('[YouTubePlayer] 큐 완료');
        playerActions.setLoading(false);
        
        // 자동 재생
        if (isPlaying && playerRef.current) {
          setTimeout(() => {
            if (playerRef.current && typeof playerRef.current.playVideo === 'function') {
              playerRef.current.playVideo();
            }
          }, 100);
        }
        
        // 큐 완료 시에도 메타데이터 추출 시도
        setTimeout(() => extractAndUpdateMetadata(), 1000);
        break;

      case PlayerState.UNSTARTED:
        console.log('[YouTubePlayer] 시작 전');
        // 시작 전 상태에서도 메타데이터 추출 시도
        setTimeout(() => extractAndUpdateMetadata(), 1000);
        break;
    }
  }, [playerActions, isPlaying, extractAndUpdateMetadata]);

  const handlePlayerError = useCallback((event: any) => {
    const errorCode = event.data;
    let errorMessage = '비디오 재생 중 오류가 발생했습니다.';

    switch (errorCode) {
      case 2:
        errorMessage = '잘못된 비디오 ID입니다.';
        break;
      case 5:
        errorMessage = 'HTML5 플레이어 오류가 발생했습니다.';
        break;
      case 100:
        errorMessage = '비디오를 찾을 수 없습니다.';
        break;
      case 101:
      case 150:
        errorMessage = '비디오 소유자가 재생을 허용하지 않습니다.';
        break;
    }

    console.error('[YouTubePlayer] Player Error:', errorCode, errorMessage);
    
    playerActions.setError(errorMessage);
    playerActions.setLoading(false);
    
    toast({
      title: '재생 오류',
      description: errorMessage,
      variant: 'destructive',
    });

    // 재시도 로직
    if (retryCountRef.current < MAX_RETRY) {
      retryCountRef.current++;
      setTimeout(() => {
        console.log('[YouTubePlayer] 다음 트랙으로 이동 시도');
        playerActions.nextTrack();
      }, 2000);
    } else {
      playerActions.setPlayerReady(false);
      retryCountRef.current = 0;
    }
  }, [playerActions]);

  /**
   * YouTube IFrame API 로드
   */
  useEffect(() => {
    if (window.YT && window.YT.Player) {
      isAPIReadyRef.current = true;
      console.log('[YouTubePlayer] YouTube API 이미 로드됨');
      return;
    }

    console.log('[YouTubePlayer] YouTube API 로드 시작');
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    tag.onerror = () => {
      console.error('[YouTubePlayer] YouTube API 로드 실패');
      playerActions.setError('YouTube API를 로드할 수 없습니다.');
      toast({
        title: '로드 실패',
        description: 'YouTube API를 로드할 수 없습니다. 인터넷 연결을 확인하세요.',
        variant: 'destructive',
      });
    };

    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    window.onYouTubeIframeAPIReady = () => {
      console.log('[YouTubePlayer] YouTube API 로드 완료');
      isAPIReadyRef.current = true;
    };

    return () => {
      window.onYouTubeIframeAPIReady = () => {};
    };
  }, [playerActions]);

  /**
   * 플레이어 초기화 (최초 1회만)
   */
  useEffect(() => {
    if (!isAPIReadyRef.current || !currentTrack || playerRef.current) {
      return;
    }

    console.log('[YouTubePlayer] 플레이어 최초 생성:', currentTrack.videoId);
    currentVideoIdRef.current = currentTrack.videoId;
    
    try {
      playerRef.current = new window.YT.Player('youtube-player', {
        height: '0',
        width: '0',
        videoId: currentTrack.videoId,
        playerVars: {
          autoplay: isPlaying ? 1 : 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          playsinline: 1,
          rel: 0,
          iv_load_policy: 3, // 주석 비활성화
          cc_load_policy: 0, // 자막 비활성화
        },
        events: {
          onReady: handlePlayerReady,
          onStateChange: handleStateChange,
          onError: handlePlayerError,
        },
      });
    } catch (error) {
      console.error('[YouTubePlayer] 플레이어 생성 에러:', error);
      playerActions.setError('플레이어 생성에 실패했습니다.');
    }

    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
      if (metadataRetryTimeoutRef.current) {
        clearTimeout(metadataRetryTimeoutRef.current);
      }
    };
  }, [isAPIReadyRef.current, currentTrack?.videoId]);

  /**
   * 트랙 변경 시 비디오 로드 (플레이어 재사용)
   */
  useEffect(() => {
    if (!playerRef.current || !currentTrack || !isPlayerReady) {
      return;
    }

    // 동일한 비디오인 경우 스킵
    if (currentVideoIdRef.current === currentTrack.videoId) {
      console.log('[YouTubePlayer] 동일한 비디오, 스킵');
      return;
    }

    console.log('[YouTubePlayer] 비디오 변경:', currentTrack.videoId);
    currentVideoIdRef.current = currentTrack.videoId;

    try {
      if (typeof playerRef.current.loadVideoById === 'function') {
        playerActions.setLoading(true);
        
        // 기존 플레이어를 재사용하여 새 비디오 로드
        if (isPlaying) {
          playerRef.current.loadVideoById({
            videoId: currentTrack.videoId,
            startSeconds: 0,
          });
        } else {
          playerRef.current.cueVideoById({
            videoId: currentTrack.videoId,
            startSeconds: 0,
          });
        }
        
        console.log('[YouTubePlayer] 비디오 로드 완료');
      }
    } catch (error) {
      console.error('[YouTubePlayer] 비디오 로드 에러:', error);
      playerActions.setError('비디오 로드에 실패했습니다.');
      playerActions.setLoading(false);
    }
  }, [currentTrack?.videoId, isPlayerReady]);

  /**
   * 재생/일시정지 동기화
   */
  useEffect(() => {
    if (!playerRef.current || !isPlayerReady) {
      return;
    }

    const syncPlaybackState = () => {
      try {
        if (typeof playerRef.current.getPlayerState !== 'function') {
          return;
        }

        const currentState = playerRef.current.getPlayerState();
        
        if (isPlaying) {
          if (currentState !== PlayerState.PLAYING && currentState !== PlayerState.BUFFERING) {
            if (typeof playerRef.current.playVideo === 'function') {
              console.log('[YouTubePlayer] 재생 시작');
              playerRef.current.playVideo();
            }
          }
        } else {
          if (currentState === PlayerState.PLAYING) {
            if (typeof playerRef.current.pauseVideo === 'function') {
              console.log('[YouTubePlayer] 일시정지');
              playerRef.current.pauseVideo();
            }
          }
        }
      } catch (error) {
        console.error('[YouTubePlayer] 재생 상태 동기화 에러:', error);
      }
    };

    syncPlaybackState();
  }, [isPlaying, isPlayerReady]);

  /**
   * 재생 속도 동기화
   */
  useEffect(() => {
    if (!playerRef.current || !isPlayerReady) {
      return;
    }

    try {
      if (typeof playerRef.current.setPlaybackRate === 'function') {
        console.log('[YouTubePlayer] 재생 속도 변경:', playbackRate);
        playerRef.current.setPlaybackRate(playbackRate);
      }
    } catch (error) {
      console.error('[YouTubePlayer] 재생 속도 변경 에러:', error);
    }
  }, [playbackRate, isPlayerReady]);

  return <div id="youtube-player" className="hidden" />;
};