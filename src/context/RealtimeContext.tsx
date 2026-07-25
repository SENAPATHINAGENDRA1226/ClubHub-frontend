import React, { createContext, useContext, useEffect, useCallback } from 'react';
import { wsClient, WebSocketCallback } from '../services/ws';
import { useAuth } from './AuthContext';

interface RealtimeContextType {
  ws: typeof wsClient;
  subscribe: (channel: string, callback: WebSocketCallback) => () => void;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

export const RealtimeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      wsClient.connect();
    } else {
      wsClient.disconnect();
    }

    return () => {
      wsClient.disconnect();
    };
  }, [isAuthenticated]);

  const subscribe = useCallback((channel: string, callback: WebSocketCallback) => {
    wsClient.on(channel, callback);
    return () => {
      wsClient.off(channel, callback);
    };
  }, []);

  return (
    <RealtimeContext.Provider value={{ ws: wsClient, subscribe }}>
      {children}
    </RealtimeContext.Provider>
  );
};

export const useRealtime = () => {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return context;
}
