import { useState } from 'react';
import { Playlist } from '@/lib/db';
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
import { usePlaylist } from '@/contexts/PlaylistContext';

/**
 * 플레이리스트 관리 컴포넌트
 * 
 * Context를 통해 직접 플레이리스트 관리
 */
export const PlaylistManager = () => {
  const {
    playlists,
    currentPlaylistId,
    currentPlaylist,
    createPlaylist,
    updatePlaylist,
    deletePlaylist,
    switchPlaylist,
  } = usePlaylist();

  const [isOpen, setIsOpen] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [editingPlaylist, setEditingPlaylist] = useState<Playlist | null>(null);
  const [editName, setEditName] = useState('');
  const [deletingPlaylist, setDeletingPlaylist] = useState<Playlist | null>(null);

  /**
   * 플레이리스트 생성
   */
  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) return;

    const playlist = await createPlaylist(newPlaylistName.trim());
    if (playlist) {
      setNewPlaylistName('');
      await switchPlaylist(playlist.id);
    }
  };

  /**
   * 플레이리스트 수정
   */
  const handleUpdatePlaylist = async () => {
    if (!editingPlaylist || !editName.trim()) return;

    await updatePlaylist({ ...editingPlaylist, name: editName.trim() });
    setEditingPlaylist(null);
    setEditName('');
  };

  /**
   * 플레이리스트 삭제
   */
  const handleDeletePlaylist = async () => {
    if (!deletingPlaylist) return;

    await deletePlaylist(deletingPlaylist.id);
    setDeletingPlaylist(null);
  };

  /**
   * Enter 키 처리
   */
  const handleCreateKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCreatePlaylist();
    }
  };

  const handleEditKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleUpdatePlaylist();
    }
  };

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
              플레이리스트를 생성, 수정, 삭제할 수 있습니다
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* 새 플레이리스트 생성 */}
            <div className="flex gap-2">
              <Input
                placeholder="새 플레이리스트 이름..."
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                onKeyDown={handleCreateKeyDown}
              />
              <Button 
                onClick={handleCreatePlaylist} 
                size="icon"
                disabled={!newPlaylistName.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* 플레이리스트 목록 */}
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
                        switchPlaylist(playlist.id);
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
                      <Check className="h-5 w-5 text-primary flex-shrink-0" />
                    )}

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditingPlaylist(playlist);
                        setEditName(playlist.name);
                      }}
                      className="flex-shrink-0"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeletingPlaylist(playlist)}
                      disabled={playlists.length === 1}
                      className="flex-shrink-0"
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

      {/* 수정 다이얼로그 */}
      <Dialog 
        open={!!editingPlaylist} 
        onOpenChange={(open) => !open && setEditingPlaylist(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>플레이리스트 수정</DialogTitle>
          </DialogHeader>
          <Input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onKeyDown={handleEditKeyDown}
          />
          <DialogFooter>
            <Button variant="secondary" onClick={() => setEditingPlaylist(null)}>
              취소
            </Button>
            <Button onClick={handleUpdatePlaylist} disabled={!editName.trim()}>
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog 
        open={!!deletingPlaylist} 
        onOpenChange={(open) => !open && setDeletingPlaylist(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>플레이리스트 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              '{deletingPlaylist?.name}' 플레이리스트를 삭제하시겠습니까?
              이 작업은 되돌릴 수 없으며 모든 트랙이 함께 삭제됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePlaylist}>
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};