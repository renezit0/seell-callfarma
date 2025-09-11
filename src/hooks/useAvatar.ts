import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UserAvatar {
  id: string;
  user_id: number;
  file_name: string;
  storage_path: string;
  created_at: string;
}

export const useAvatar = () => {
  const [avatars, setAvatars] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(false);

  const fetchAvatars = useCallback(async (userIds: number[]) => {
    if (userIds.length === 0) return;

    try {
      setLoading(true);
      
      // Buscar registros de avatares na tabela
      const { data: avatarRecords, error } = await supabase
        .from('user_avatars')
        .select('user_id, storage_path')
        .in('user_id', userIds);

      if (error) throw error;

      const avatarMap: Record<number, string> = {};
      
      // Para cada avatar encontrado, gerar a URL pública
      if (avatarRecords) {
        for (const record of avatarRecords) {
          const { data: publicUrlData } = supabase.storage
            .from('user-avatars')
            .getPublicUrl(record.storage_path);
          
          if (publicUrlData?.publicUrl) {
            avatarMap[record.user_id] = publicUrlData.publicUrl;
          }
        }
      }

      setAvatars(prev => ({ ...prev, ...avatarMap }));
    } catch (error) {
      console.error('Erro ao buscar avatares:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const uploadAvatar = useCallback(async (userId: number, file: File): Promise<boolean> => {
    try {
      setLoading(true);

      // Gerar nome único para o arquivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload para o storage
      const { error: uploadError } = await supabase.storage
        .from('user-avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Registrar na tabela
      const { error: dbError } = await supabase
        .from('user_avatars')
        .upsert({
          user_id: userId,
          file_name: fileName,
          file_size: file.size,
          mime_type: file.type,
          storage_path: filePath
        }, {
          onConflict: 'user_id'
        });

      if (dbError) throw dbError;

      // Atualizar o estado local
      await fetchAvatars([userId]);
      
      return true;
    } catch (error) {
      console.error('Erro ao fazer upload do avatar:', error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchAvatars]);

  const deleteAvatar = useCallback(async (userId: number): Promise<boolean> => {
    try {
      setLoading(true);

      // Buscar o registro do avatar
      const { data: avatarRecord, error: fetchError } = await supabase
        .from('user_avatars')
        .select('storage_path')
        .eq('user_id', userId)
        .single();

      if (fetchError) throw fetchError;

      if (avatarRecord) {
        // Deletar do storage
        const { error: storageError } = await supabase.storage
          .from('user-avatars')
          .remove([avatarRecord.storage_path]);

        if (storageError) throw storageError;

        // Deletar da tabela
        const { error: dbError } = await supabase
          .from('user_avatars')
          .delete()
          .eq('user_id', userId);

        if (dbError) throw dbError;

        // Remover do estado local
        setAvatars(prev => {
          const newAvatars = { ...prev };
          delete newAvatars[userId];
          return newAvatars;
        });
      }

      return true;
    } catch (error) {
      console.error('Erro ao deletar avatar:', error);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    avatars,
    loading,
    fetchAvatars,
    uploadAvatar,
    deleteAvatar
  };
};