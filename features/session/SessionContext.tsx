'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { SessionState } from './types';
import { sessionService } from './service';
import { ApiError } from '../../lib/api';

const SessionContext = createContext<SessionState & { refresh: () => void; logout: () => void }>({
  status: 'LOADING',
  refresh: () => {},
  logout: () => {},
});

export const SessionProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<SessionState>({ status: 'LOADING' });

  const fetchUser = async () => {
    try {
      const user = await sessionService.getUser();
      setState({ status: 'AUTHENTICATED', user });
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setState({ status: 'UNAUTHENTICATED' });
      } else {
        setState({ status: 'ERROR', message: 'Bağlantı hatası veya sunucu yanıtsız.' });
      }
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const logout = async () => {
    try {
      await sessionService.logout();
    } finally {
      setState({ status: 'UNAUTHENTICATED' });
    }
  };

  return (
    <SessionContext.Provider value={{ ...state, refresh: fetchUser, logout }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => useContext(SessionContext);