import { useEffect, useState } from 'react';
import { ensureAnonymousAuth } from '../firebase';

/**
 * React hook that returns the current Firebase anonymous uid.
 */
export const useAuthUid = () => {
  const [uid, setUid] = useState<string | null>(null);

  useEffect(() => {
    ensureAnonymousAuth()
      .then(setUid)
      .catch((err) => console.error('Failed to authenticate anonymously', err));
  }, []);

  return uid;
};