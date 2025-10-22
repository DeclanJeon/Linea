import { Playlist, Track } from './db';

export interface PlaylistExportData {
  version: string;
  playlist: Playlist;
  tracks: Track[];
  exportedAt: number;
}

export const exportPlaylist = (playlist: Playlist, tracks: Track[]): void => {
  const data: PlaylistExportData = {
    version: '1.0',
    playlist,
    tracks,
    exportedAt: Date.now(),
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${playlist.name.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const importPlaylist = (file: File): Promise<PlaylistExportData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        
        // Validate data structure
        if (!data.playlist || !data.tracks || !Array.isArray(data.tracks)) {
          throw new Error('Invalid playlist file format');
        }

        resolve(data as PlaylistExportData);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
};
