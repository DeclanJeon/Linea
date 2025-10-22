import { useEffect, useRef, useState, useCallback } from 'react';
import { Track } from '@/lib/db';
import { getYouTubeThumbnail } from '@/lib/utils';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface YouTubePlayerProps {
  tracks: Track[];
  currentIndex: number;
  isPlaying: boolean;
  playbackRate: number;
  isShuffled: boolean;
  onTrackEnd: () => void;
  onPlayPause: (playing: boolean) => void;
  onTrackMetadataUpdate: (index: number, metadata: { title: string; thumbnail: string }) => void;
}

export const YouTubePlayer = ({
  tracks,
  currentIndex,
  isPlaying,
  playbackRate,
  isShuffled,
  onTrackEnd,
  onPlayPause,
  onTrackMetadataUpdate,
}: YouTubePlayerProps) => {
  const playerRef = useRef<any>(null);
  const [isReady, setIsReady] = useState(false);
  const [isPlayerReady, setIsPlayerReady] = useState(false);

  /**
   * 비디오 메타데이터를 추출하고 부모 컴포넌트에 전달합니다.
   */
  const extractVideoMetadata = useCallback(() => {
    if (!playerRef.current || typeof playerRef.current.getVideoData !== 'function') {
      return;
    }

    const videoData = playerRef.current.getVideoData();
    if (videoData && videoData.title && videoData.video_id) {
      const thumbnail = getYouTubeThumbnail(videoData.video_id, 'maxresdefault');
      onTrackMetadataUpdate(currentIndex, {
        title: videoData.title,
        thumbnail,
      });
    }
  }, [currentIndex, onTrackMetadataUpdate]);

  useEffect(() => {
    // YouTube IFrame API 로드
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = () => {
        setIsReady(true);
      };
    } else {
      setIsReady(true);
    }
  }, []);

  useEffect(() => {
    if (isReady && tracks.length > 0 && !playerRef.current) {
      playerRef.current = new window.YT.Player('youtube-player', {
        height: '0',
        width: '0',
        videoId: tracks[currentIndex]?.videoId,
        playerVars: {
          autoplay: 0,
          controls: 0,
        },
        events: {
          onReady: (event: any) => {
            console.log('✅ YouTube Player ready');
            setIsPlayerReady(true);
            // 플레이어가 준비되면 즉시 메타데이터 추출
            extractVideoMetadata();
          },
          onStateChange: (event: any) => {
            if (event.data === window.YT.PlayerState.ENDED) {
              onTrackEnd();
            } else if (event.data === window.YT.PlayerState.PLAYING) {
              onPlayPause(true);
              // 재생 시작 시 메타데이터 재확인
              extractVideoMetadata();
            } else if (event.data === window.YT.PlayerState.PAUSED) {
              onPlayPause(false);
            }
          },
        },
      });
    }
  }, [isReady, tracks.length, currentIndex, extractVideoMetadata, onTrackEnd, onPlayPause]);

  useEffect(() => {
    if (isPlayerReady && playerRef.current && tracks[currentIndex]) {
      if (typeof playerRef.current.loadVideoById === 'function') {
        playerRef.current.loadVideoById(tracks[currentIndex].videoId);
        if (isPlaying) {
          playerRef.current.playVideo();
        }

        // 비디오 로드 후 메타데이터 추출 (onReady 이벤트가 다시 발생하지 않으므로)
        setTimeout(extractVideoMetadata, 500);
      }
    }
  }, [currentIndex, tracks, isPlayerReady, isPlaying, extractVideoMetadata]);

  useEffect(() => {
    if (isPlayerReady && playerRef.current) {
      if (typeof playerRef.current.playVideo === 'function' && typeof playerRef.current.pauseVideo === 'function') {
        if (isPlaying) {
          playerRef.current.playVideo();
        } else {
          playerRef.current.pauseVideo();
        }
      }
    }
  }, [isPlaying, isPlayerReady]);

  useEffect(() => {
    if (isPlayerReady && playerRef.current) {
      if (typeof playerRef.current.setPlaybackRate === 'function') {
        playerRef.current.setPlaybackRate(playbackRate);
      }
    }
  }, [playbackRate, isPlayerReady]);

  return <div id="youtube-player" className="hidden"></div>;
};
