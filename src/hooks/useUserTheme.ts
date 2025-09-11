import { useEffect } from 'react';
import { useAuth } from './useAuth';

export function useUserTheme() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.tipo) return;

    // Remove all existing user-type classes
    const bodyClasses = document.body.className.split(' ');
    const filteredClasses = bodyClasses.filter(className => !className.startsWith('user-type-'));
    document.body.className = filteredClasses.join(' ');

    // Add the new user-type class
    document.body.classList.add(`user-type-${user.tipo.toLowerCase()}`);

    return () => {
      // Cleanup on unmount
      const bodyClasses = document.body.className.split(' ');
      const filteredClasses = bodyClasses.filter(className => !className.startsWith('user-type-'));
      document.body.className = filteredClasses.join(' ');
    };
  }, [user?.tipo]);
}