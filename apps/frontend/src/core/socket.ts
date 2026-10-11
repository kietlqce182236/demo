import { io, Socket } from 'socket.io-client';

const getSocketUrl = (): string => {
  if (import.meta.env.VITE_WS_URL) return import.meta.env.VITE_WS_URL;
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.host}/kitchen`;
  }
  return 'http://localhost:3000/kitchen';
};

const SOCKET_URL = getSocketUrl();

let socket: Socket | null = null;

export const getKitchenSocket = (): Socket => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      autoConnect: true,
    });

    socket.on('connect', () => {
      console.log('🟢 [WebSocket] Đã kết nối thành công tới KDS Kitchen Gateway:', socket?.id);
    });

    socket.on('disconnect', (reason) => {
      console.warn('🔴 [WebSocket] Mất kết nối tới Kitchen Gateway:', reason);
    });

    socket.on('connect_error', (error) => {
      console.error('⚠️ [WebSocket] Lỗi kết nối Socket.IO:', error.message);
    });
  }

  return socket;
};
