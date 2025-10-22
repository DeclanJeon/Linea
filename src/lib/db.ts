// IndexedDB utility for playlist management
const DB_NAME = 'YouTubePlayerDB';
const TRACKS_STORE = 'tracks';
const PLAYLISTS_STORE = 'playlists';
const SETTINGS_STORE = 'settings';
const DB_VERSION = 2;

export interface Track {
  id: string;
  playlistId: string;
  url: string;
  title: string;
  videoId: string;
  addedAt: number;
  thumbnail?: string; // 썸네일 URL 추가
  duration?: number;  // 선택적: 재생 시간
}

export interface Playlist {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
}

let db: IDBDatabase | null = null;

export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;
      
      // Create tracks store
      if (!database.objectStoreNames.contains(TRACKS_STORE)) {
        const tracksStore = database.createObjectStore(TRACKS_STORE, { keyPath: 'id' });
        tracksStore.createIndex('playlistId', 'playlistId', { unique: false });
      }
      
      // Create playlists store
      if (!database.objectStoreNames.contains(PLAYLISTS_STORE)) {
        database.createObjectStore(PLAYLISTS_STORE, { keyPath: 'id' });
      }
      
      // Create settings store
      if (!database.objectStoreNames.contains(SETTINGS_STORE)) {
        database.createObjectStore(SETTINGS_STORE, { keyPath: 'key' });
      }

      // Migrate old data if exists
      if (event.oldVersion < 2) {
        const transaction = (event.target as IDBOpenDBRequest).transaction!;
        const playlistsStore = transaction.objectStore(PLAYLISTS_STORE);
        const defaultPlaylist: Playlist = {
          id: 'default',
          name: '기본 플레이리스트',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        playlistsStore.add(defaultPlaylist);

        // Set default playlist as current
        const settingsStore = transaction.objectStore(SETTINGS_STORE);
        settingsStore.add({ key: 'currentPlaylistId', value: 'default' });
      }
    };
  });
};

// Playlist operations
export const createPlaylist = async (name: string): Promise<Playlist> => {
  const database = await initDB();
  const playlist: Playlist = {
    id: `playlist-${Date.now()}-${Math.random()}`,
    name,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([PLAYLISTS_STORE], 'readwrite');
    const store = transaction.objectStore(PLAYLISTS_STORE);
    const request = store.add(playlist);

    request.onsuccess = () => resolve(playlist);
    request.onerror = () => reject(request.error);
  });
};

export const getAllPlaylists = async (): Promise<Playlist[]> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([PLAYLISTS_STORE], 'readonly');
    const store = transaction.objectStore(PLAYLISTS_STORE);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const updatePlaylist = async (playlist: Playlist): Promise<void> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([PLAYLISTS_STORE], 'readwrite');
    const store = transaction.objectStore(PLAYLISTS_STORE);
    const request = store.put({ ...playlist, updatedAt: Date.now() });

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const deletePlaylist = async (playlistId: string): Promise<void> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([PLAYLISTS_STORE, TRACKS_STORE], 'readwrite');
    
    // Delete playlist
    const playlistStore = transaction.objectStore(PLAYLISTS_STORE);
    playlistStore.delete(playlistId);
    
    // Delete all tracks in this playlist
    const tracksStore = transaction.objectStore(TRACKS_STORE);
    const index = tracksStore.index('playlistId');
    const request = index.openCursor(IDBKeyRange.only(playlistId));
    
    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
};

// Track operations
export const addTrack = async (track: Track): Promise<void> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([TRACKS_STORE], 'readwrite');
    const store = transaction.objectStore(TRACKS_STORE);
    const request = store.add(track);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const getTracksByPlaylist = async (playlistId: string): Promise<Track[]> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([TRACKS_STORE], 'readonly');
    const store = transaction.objectStore(TRACKS_STORE);
    const index = store.index('playlistId');
    const request = index.getAll(playlistId);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const getAllTracks = async (): Promise<Track[]> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([TRACKS_STORE], 'readonly');
    const store = transaction.objectStore(TRACKS_STORE);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const deleteTrack = async (id: string): Promise<void> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([TRACKS_STORE], 'readwrite');
    const store = transaction.objectStore(TRACKS_STORE);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const updateTrack = async (track: Track): Promise<void> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([TRACKS_STORE], 'readwrite');
    const store = transaction.objectStore(TRACKS_STORE);
    const request = store.put(track);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

// Settings operations
export const getCurrentPlaylistId = async (): Promise<string> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([SETTINGS_STORE], 'readonly');
    const store = transaction.objectStore(SETTINGS_STORE);
    const request = store.get('currentPlaylistId');

    request.onsuccess = () => {
      resolve(request.result?.value || 'default');
    };
    request.onerror = () => reject(request.error);
  });
};

export const setCurrentPlaylistId = async (playlistId: string): Promise<void> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([SETTINGS_STORE], 'readwrite');
    const store = transaction.objectStore(SETTINGS_STORE);
    const request = store.put({ key: 'currentPlaylistId', value: playlistId });

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

// Utility
export const extractVideoId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
};
