import React, { createContext, useContext, useReducer, useCallback, useEffect, useRef } from 'react';
import { Track } from '@/lib/db';

/**
 * PlayerState 인터페이스
 */
interface PlayerState {
  tracks: Track[];
  currentIndex: number;
  isPlaying: boolean;
  isShuffled: boolean;
  playbackRate: number;
  isPlayerReady: boolean;
  isLoading: boolean;
  error: string | null;
  shuffledIndices: number[];
}

/**
 * PlayerActions 타입
 */
type PlayerAction =
  | { type: 'SET_TRACKS'; payload: Track[] }
  | { type: 'UPDATE_TRACKS'; payload: Track[] }
  | { type: 'SET_CURRENT_INDEX'; payload: number }
  | { type: 'SET_IS_PLAYING'; payload: boolean }
  | { type: 'TOGGLE_SHUFFLE' }
  | { type: 'SET_PLAYBACK_RATE'; payload: number }
  | { type: 'SET_PLAYER_READY'; payload: boolean }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'UPDATE_TRACK_METADATA'; payload: { index: number; title: string; thumbnail: string } }
  | { type: 'NEXT_TRACK' }
  | { type: 'PREVIOUS_TRACK' }
  | { type: 'PLAY_TRACK'; payload: number };

/**
 * PlayerContext 인터페이스
 */
interface PlayerContextType {
  state: PlayerState;
  actions: {
    setTracks: (tracks: Track[]) => void;
    updateTracks: (tracks: Track[]) => void;
    playTrack: (index: number) => void;
    togglePlayPause: () => void;
    nextTrack: () => void;
    previousTrack: () => void;
    toggleShuffle: () => void;
    setPlaybackRate: (rate: number) => void;
    setPlayerReady: (ready: boolean) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    updateTrackMetadata: (index: number, metadata: { title: string; thumbnail: string }) => void;
    playAll: () => void;
  };
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

/**
 * Fisher-Yates 셔플 알고리즘
 */
const shuffleArray = (array: number[]): number[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

/**
 * 현재 재생 중인 트랙을 새 트랙 배열에서 찾기
 */
const findCurrentTrackIndex = (currentTrack: Track | undefined, newTracks: Track[]): number => {
  if (!currentTrack) return -1;
  return newTracks.findIndex(track => track.id === currentTrack.id);
};

/**
 * Player Reducer
 */
const playerReducer = (state: PlayerState, action: PlayerAction): PlayerState => {
  switch (action.type) {
    case 'SET_TRACKS': {
      // 초기 로드 시에만 사용 (currentIndex를 0으로 초기화)
      const tracks = action.payload;
      const shuffledIndices = state.isShuffled 
        ? shuffleArray(tracks.map((_, i) => i))
        : tracks.map((_, i) => i);
      
      return {
        ...state,
        tracks,
        shuffledIndices,
        currentIndex: tracks.length > 0 ? 0 : -1,
        error: null,
      };
    }

    case 'UPDATE_TRACKS': {
      // 트랙 목록 업데이트 시 현재 재생 중인 트랙의 인덱스 유지
      const tracks = action.payload;
      const currentTrack = state.tracks[state.currentIndex];
      
      // 현재 트랙을 새 배열에서 찾기
      let newCurrentIndex = findCurrentTrackIndex(currentTrack, tracks);
      
      // 현재 트랙이 삭제된 경우
      if (newCurrentIndex === -1) {
        if (tracks.length === 0) {
          newCurrentIndex = -1;
        } else if (state.currentIndex >= tracks.length) {
          // 마지막 트랙이 삭제된 경우 이전 트랙으로
          newCurrentIndex = tracks.length - 1;
        } else {
          // 중간 트랙이 삭제된 경우 같은 위치의 다음 트랙으로
          newCurrentIndex = Math.min(state.currentIndex, tracks.length - 1);
        }
      }
      
      const shuffledIndices = state.isShuffled 
        ? shuffleArray(tracks.map((_, i) => i))
        : tracks.map((_, i) => i);
      
      console.log('[PlayerReducer] 트랙 업데이트:', {
        oldIndex: state.currentIndex,
        newIndex: newCurrentIndex,
        oldTrack: currentTrack?.title,
        newTrack: tracks[newCurrentIndex]?.title,
        tracksCount: tracks.length,
      });
      
      return {
        ...state,
        tracks,
        shuffledIndices,
        currentIndex: newCurrentIndex,
        error: null,
      };
    }

    case 'SET_CURRENT_INDEX': {
      const newIndex = action.payload;
      if (newIndex < 0 || newIndex >= state.tracks.length) {
        return state;
      }
      return {
        ...state,
        currentIndex: newIndex,
        error: null,
      };
    }

    case 'SET_IS_PLAYING':
      return { ...state, isPlaying: action.payload };

    case 'TOGGLE_SHUFFLE': {
      const newIsShuffled = !state.isShuffled;
      const shuffledIndices = newIsShuffled
        ? shuffleArray(state.tracks.map((_, i) => i))
        : state.tracks.map((_, i) => i);

      return {
        ...state,
        isShuffled: newIsShuffled,
        shuffledIndices,
      };
    }

    case 'SET_PLAYBACK_RATE':
      return { ...state, playbackRate: action.payload };

    case 'SET_PLAYER_READY':
      return { ...state, isPlayerReady: action.payload };

    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };

    case 'UPDATE_TRACK_METADATA': {
      const { index, title, thumbnail } = action.payload;
      const updatedTracks = [...state.tracks];
      if (updatedTracks[index]) {
        updatedTracks[index] = {
          ...updatedTracks[index],
          title,
          thumbnail,
        };
      }
      return { ...state, tracks: updatedTracks };
    }

    case 'NEXT_TRACK': {
      const currentIndexInShuffled = state.isShuffled
        ? state.shuffledIndices.indexOf(state.currentIndex)
        : state.currentIndex;
      
      const nextIndexInShuffled = currentIndexInShuffled + 1;
      
      if (nextIndexInShuffled >= state.tracks.length) {
        const nextIndex = state.isShuffled ? state.shuffledIndices[0] : 0;
        return {
          ...state,
          currentIndex: nextIndex,
          error: null,
        };
      }

      const nextIndex = state.isShuffled
        ? state.shuffledIndices[nextIndexInShuffled]
        : nextIndexInShuffled;

      return {
        ...state,
        currentIndex: nextIndex,
        error: null,
      };
    }

    case 'PREVIOUS_TRACK': {
      const currentIndexInShuffled = state.isShuffled
        ? state.shuffledIndices.indexOf(state.currentIndex)
        : state.currentIndex;
      
      const prevIndexInShuffled = currentIndexInShuffled - 1;
      
      if (prevIndexInShuffled < 0) {
        const lastIndex = state.tracks.length - 1;
        const prevIndex = state.isShuffled ? state.shuffledIndices[lastIndex] : lastIndex;
        return {
          ...state,
          currentIndex: prevIndex,
          error: null,
        };
      }

      const prevIndex = state.isShuffled
        ? state.shuffledIndices[prevIndexInShuffled]
        : prevIndexInShuffled;

      return {
        ...state,
        currentIndex: prevIndex,
        error: null,
      };
    }

    case 'PLAY_TRACK': {
      const index = action.payload;
      if (index < 0 || index >= state.tracks.length) {
        return state;
      }
      return {
        ...state,
        currentIndex: index,
        isPlaying: true,
        error: null,
      };
    }

    default:
      return state;
  }
};

const initialState: PlayerState = {
  tracks: [],
  currentIndex: -1,
  isPlaying: false,
  isShuffled: false,
  playbackRate: 1,
  isPlayerReady: false,
  isLoading: false,
  error: null,
  shuffledIndices: [],
};

/**
 * PlayerProvider 컴포넌트
 */
export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(playerReducer, initialState);
  const previousTrackRef = useRef<Track | null>(null);
  const isInitialLoadRef = useRef(true);

  /**
   * 트랙 변경 감지 및 로깅
   */
  useEffect(() => {
    const currentTrack = state.tracks[state.currentIndex];
    if (currentTrack && currentTrack !== previousTrackRef.current) {
      console.log('[PlayerContext] 트랙 변경됨:', {
        index: state.currentIndex,
        title: currentTrack.title,
        videoId: currentTrack.videoId,
      });
      previousTrackRef.current = currentTrack;
    }
  }, [state.currentIndex, state.tracks]);

  /**
   * 액션 생성자들
   */
  const actions = {
    setTracks: useCallback((tracks: Track[]) => {
      console.log('[PlayerContext] 트랙 설정됨 (초기 로드):', tracks.length);
      dispatch({ type: 'SET_TRACKS', payload: tracks });
      isInitialLoadRef.current = false;
    }, []),

    updateTracks: useCallback((tracks: Track[]) => {
      console.log('[PlayerContext] 트랙 업데이트됨:', tracks.length);
      dispatch({ type: 'UPDATE_TRACKS', payload: tracks });
    }, []),

    playTrack: useCallback((index: number) => {
      console.log('[PlayerContext] 트랙 재생:', index);
      dispatch({ type: 'PLAY_TRACK', payload: index });
    }, []),

    togglePlayPause: useCallback(() => {
      console.log('[PlayerContext] 재생/일시정지 토글:', !state.isPlaying);
      dispatch({ type: 'SET_IS_PLAYING', payload: !state.isPlaying });
    }, [state.isPlaying]),

    nextTrack: useCallback(() => {
      console.log('[PlayerContext] 다음 트랙');
      dispatch({ type: 'NEXT_TRACK' });
    }, []),

    previousTrack: useCallback(() => {
      console.log('[PlayerContext] 이전 트랙');
      dispatch({ type: 'PREVIOUS_TRACK' });
    }, []),

    toggleShuffle: useCallback(() => {
      console.log('[PlayerContext] 셔플 토글:', !state.isShuffled);
      dispatch({ type: 'TOGGLE_SHUFFLE' });
    }, [state.isShuffled]),

    setPlaybackRate: useCallback((rate: number) => {
      console.log('[PlayerContext] 재생 속도 변경:', rate);
      dispatch({ type: 'SET_PLAYBACK_RATE', payload: rate });
    }, []),

    setPlayerReady: useCallback((ready: boolean) => {
      console.log('[PlayerContext] 플레이어 준비 상태:', ready);
      dispatch({ type: 'SET_PLAYER_READY', payload: ready });
    }, []),

    setLoading: useCallback((loading: boolean) => {
      dispatch({ type: 'SET_LOADING', payload: loading });
    }, []),

    setError: useCallback((error: string | null) => {
      if (error) {
        console.error('[PlayerContext] 에러 발생:', error);
      }
      dispatch({ type: 'SET_ERROR', payload: error });
    }, []),

    updateTrackMetadata: useCallback((index: number, metadata: { title: string; thumbnail: string }) => {
      console.log('[PlayerContext] 트랙 메타데이터 업데이트:', index, metadata);
      dispatch({ 
        type: 'UPDATE_TRACK_METADATA', 
        payload: { index, ...metadata } 
      });
    }, []),

    playAll: useCallback(() => {
      console.log('[PlayerContext] 전체 재생');
      if (state.tracks.length > 0) {
        dispatch({ type: 'PLAY_TRACK', payload: 0 });
      }
    }, [state.tracks.length]),
  };

  const contextValue: PlayerContextType = {
    state,
    actions,
  };

  return (
    <PlayerContext.Provider value={contextValue}>
      {children}
    </PlayerContext.Provider>
  );
};

/**
 * usePlayer 훅
 */
export const usePlayer = (): PlayerContextType => {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer는 PlayerProvider 내부에서 사용되어야 합니다.');
  }
  return context;
};