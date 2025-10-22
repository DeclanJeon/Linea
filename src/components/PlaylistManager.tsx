import { useState } from 'react';
import { Playlist, createPlaylist, deletePlaylist, updatePlaylist } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { List, Plus, Pencil, Trash2, Check } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface PlaylistManagerProps {
  playlists: Playlist[];
  currentPlaylistId: string;
  onPlaylistChange: (playlistId: string) => void;
  onPlaylistsChanged: () => void;
}

export const PlaylistManager = ({
  playlists,
  currentPlaylistId,
  onPlaylistChange,
  onPlaylistsChanged,
}: PlaylistManagerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [editingPlaylist, setEditingPlaylist] = useState<Playlist | null>(null);
  const [editName, setEditName] = useState('');
  const [deletingPlaylist, setDeletingPlaylist] = useState<Playlist | null>(null);

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) return;

    try {
      const playlist = await createPlaylist(newPlaylistName.trim());
      setNewPlaylistName('');
      onPlaylistsChanged();
      onPlaylistChange(playlist.id);
      toast({
        title: '생성됨',
        description: '새 플레이리스트가 생성되었습니다.',
      });
    } catch (error) {
      toast({
        title: '오류',
        description: '플레이리스트 생성 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    }
  };

  const handleUpdatePlaylist = async () => {
    if (!editingPlaylist || !editName.trim()) return;

    try {
      await updatePlaylist({ ...editingPlaylist, name: editName.trim() });
      setEditingPlaylist(null);
      setEditName('');
      onPlaylistsChanged();
      toast({
        title: '수정됨',
        description: '플레이리스트 이름이 변경되었습니다.',
      });
    } catch (error) {
      toast({
        title: '오류',
        description: '플레이리스트 수정 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    }
  };

  const handleDeletePlaylist = async () => {
    if (!deletingPlaylist) return;

    try {
      await deletePlaylist(deletingPlaylist.id);
      setDeletingPlaylist(null);
      onPlaylistsChanged();
      
      // Switch to another playlist if current one is deleted
      if (deletingPlaylist.id === currentPlaylistId) {
        const remaining = playlists.filter(p => p.id !== deletingPlaylist.id);
        if (remaining.length > 0) {
          onPlaylistChange(remaining[0].id);
        }
      }
      
      toast({
        title: '삭제됨',
        description: '플레이리스트가 삭제되었습니다.',
      });
    } catch (error) {
      toast({
        title: '오류',
        description: '플레이리스트 삭제 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    }
  };

  const currentPlaylist = playlists.find(p => p.id === currentPlaylistId);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="secondary" className="w-full">
            <List className="mr-2 h-4 w-4" />
            {currentPlaylist?.name || '플레이리스트'}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>플레이리스트 관리</DialogTitle>
            <DialogDescription>
              플레이리스트를 선택하거나 새로 만드세요
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Create new playlist */}
            <div className="flex gap-2">
              <Input
                placeholder="새 플레이리스트 이름..."
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreatePlaylist()}
              />
              <Button onClick={handleCreatePlaylist} size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Playlist list */}
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {playlists.map((playlist) => (
                  <div
                    key={playlist.id}
                    className={`flex items-center gap-2 p-3 rounded-lg border transition-all ${
                      playlist.id === currentPlaylistId
                        ? 'bg-primary/10 border-primary'
                        : 'bg-card border-border hover:bg-card/80'
                    }`}
                  >
                    <button
                      onClick={() => {
                        onPlaylistChange(playlist.id);
                        setIsOpen(false);
                      }}
                      className="flex-1 text-left"
                    >
                      <p className="font-medium">{playlist.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(playlist.createdAt).toLocaleDateString('ko-KR')}
                      </p>
                    </button>
                    
                    {playlist.id === currentPlaylistId && (
                      <Check className="h-5 w-5 text-primary" />
                    )}
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditingPlaylist(playlist);
                        setEditName(playlist.name);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeletingPlaylist(playlist)}
                      disabled={playlists.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editingPlaylist} onOpenChange={(open) => !open && setEditingPlaylist(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>플레이리스트 이름 변경</DialogTitle>
          </DialogHeader>
          <Input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleUpdatePlaylist()}
          />
          <DialogFooter>
            <Button variant="secondary" onClick={() => setEditingPlaylist(null)}>
              취소
            </Button>
            <Button onClick={handleUpdatePlaylist}>저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deletingPlaylist} onOpenChange={(open) => !open && setDeletingPlaylist(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>플레이리스트 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              '{deletingPlaylist?.name}' 플레이리스트와 모든 트랙을 삭제하시겠습니까?
              이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePlaylist}>삭제</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
