import { useState, useEffect, useCallback } from 'react';
import { useAvatar } from './useAvatar';
import { useAuth } from './useAuth';

export const useUserAvatar = () => {
  const { user } = useAuth();
  const { avatars, fetchAvatars, uploadAvatar, deleteAvatar, loading } = useAvatar();
  const [currentUserAvatar, setCurrentUserAvatar] = useState<string | undefined>();

  useEffect(() => {
    if (user?.id) {
      // Buscar avatar do usuário atual
      fetchAvatars([user.id]);
    }
  }, [user?.id, fetchAvatars]);

  useEffect(() => {
    if (user?.id && avatars[user.id]) {
      setCurrentUserAvatar(avatars[user.id]);
    } else {
      setCurrentUserAvatar(undefined);
    }
  }, [user?.id, avatars]);

  const updateAvatar = useCallback(async (file: File) => {
    if (!user?.id) return false;
    
    const success = await uploadAvatar(user.id, file);
    if (success) {
      // Recarregar o avatar após upload
      await fetchAvatars([user.id]);
    }
    return success;
  }, [user?.id, uploadAvatar, fetchAvatars]);

  const removeAvatar = useCallback(async () => {
    if (!user?.id) return false;
    
    const success = await deleteAvatar(user.id);
    if (success) {
      setCurrentUserAvatar(undefined);
    }
    return success;
  }, [user?.id, deleteAvatar]);

  const refreshAvatar = useCallback(() => {
    if (user?.id) {
      fetchAvatars([user.id]);
    }
  }, [user?.id, fetchAvatars]);

  return {
    avatarUrl: currentUserAvatar,
    loading,
    updateAvatar,
    removeAvatar,
    refreshAvatar
  };
};