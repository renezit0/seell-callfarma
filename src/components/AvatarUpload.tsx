import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Upload, Camera, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAvatar } from '@/hooks/useAvatar';

interface AvatarUploadProps {
  userId: number;
  userName: string;
  currentAvatarUrl?: string;
  size?: 'sm' | 'md' | 'lg';
  mode?: 'display' | 'edit';
  onAvatarChange?: () => void;
}

export const AvatarUpload = ({ 
  userId, 
  userName, 
  currentAvatarUrl, 
  size = 'md',
  mode = 'edit',
  onAvatarChange 
}: AvatarUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadAvatar, deleteAvatar } = useAvatar();

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-24 h-24'
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione apenas arquivos de imagem');
      return;
    }

    // Validar tamanho (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 5MB');
      return;
    }

    handleUpload(file);
  };

  const handleUpload = async (file: File) => {
    try {
      setUploading(true);
      
      const success = await uploadAvatar(userId, file);
      
      if (success) {
        toast.success('Avatar atualizado com sucesso!');
        onAvatarChange?.();
      } else {
        toast.error('Erro ao fazer upload do avatar');
      }
    } catch (error) {
      console.error('Erro no upload:', error);
      toast.error('Erro ao fazer upload do avatar');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setUploading(true);
      
      const success = await deleteAvatar(userId);
      
      if (success) {
        toast.success('Avatar removido com sucesso!');
        onAvatarChange?.();
      } else {
        toast.error('Erro ao remover avatar');
      }
    } catch (error) {
      console.error('Erro ao deletar:', error);
      toast.error('Erro ao remover avatar');
    } finally {
      setUploading(false);
    }
  };

  if (mode === 'display') {
    return (
      <Avatar className={sizeClasses[size]}>
        {currentAvatarUrl ? (
          <AvatarImage 
            src={currentAvatarUrl} 
            alt={`Avatar de ${userName}`}
            className="object-cover"
          />
        ) : null}
        <AvatarFallback className="text-sm">
          {userName.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
    );
  }

  return (
    <div className="flex items-center space-x-3">
      <Avatar className={sizeClasses[size]}>
        {currentAvatarUrl ? (
          <AvatarImage 
            src={currentAvatarUrl} 
            alt={`Avatar de ${userName}`}
            className="object-cover"
          />
        ) : null}
        <AvatarFallback className="text-sm">
          {userName.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full" />
          ) : (
            <Camera className="w-4 h-4" />
          )}
          {size === 'lg' && <span className="ml-2">Alterar</span>}
        </Button>

        {currentAvatarUrl && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            disabled={uploading}
          >
            <Trash2 className="w-4 h-4" />
            {size === 'lg' && <span className="ml-2">Remover</span>}
          </Button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
};