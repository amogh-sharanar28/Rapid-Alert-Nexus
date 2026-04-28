import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:4000';

interface UseSocketOptions {
  onNewAlert?: (alert: any) => void;
  onNewFeed?: (feed: any) => void;
  onProcessingUpdate?: (data: { log: any; summary: any }) => void;
}

export function useSocket(options: UseSocketOptions = {}) {
  const socketRef = useRef<Socket | null>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    // Create socket connection with explicit URL and options
    socketRef.current = io(SOCKET_URL, {
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      transports: ['websocket', 'polling'],
      forceNew: true,
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('✅ Socket connected:', socket.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
    });

    socket.on('connect_error', (error) => {
      console.error('🔴 Socket connection error:', error.message);
    });

    socket.on('new_alert', (alert) => {
      console.log('📨 RECEIVED ALERT:', alert.id, alert.incidentType);
      if (optionsRef.current.onNewAlert) {
        optionsRef.current.onNewAlert(alert);
      }
    });

    socket.on('new_feed', (feed) => {
      console.log('📨 RECEIVED FEED:', feed.id);
      if (optionsRef.current.onNewFeed) {
        optionsRef.current.onNewFeed(feed);
      }
    });

    socket.on('processing_update', (data) => {
      console.log('📨 RECEIVED PROCESSING UPDATE:', data.log?.id, data.log?.stage);
      if (optionsRef.current.onProcessingUpdate) {
        optionsRef.current.onProcessingUpdate(data);
      }
    });

    // Cleanup on unmount
    return () => {
      console.log('🧹 Cleaning up socket connection');
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  }, []);

  const reconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.connect();
    }
  }, []);

  return {
    socket: socketRef.current,
    disconnect,
    reconnect,
    isConnected: socketRef.current?.connected ?? false,
  };
}