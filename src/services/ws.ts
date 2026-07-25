export type WebSocketCallback = (data: any) => void;

export class WebSocketClient {
  private baseUrl: string;
  private socket: WebSocket | null = null;
  private listeners: Map<string, Set<WebSocketCallback>> = new Map();

  constructor(baseUrl: string = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws/updates') {
    this.baseUrl = baseUrl;
  }

  connect() {
    const token = localStorage.getItem('access_token');
    const url = token ? `${this.baseUrl}?token=${token}` : this.baseUrl;

    this.socket = new WebSocket(url);

    this.socket.onopen = () => {
      console.log('WebSocket connected to:', this.baseUrl);
    };

    this.socket.onmessage = (event) => {
      if (event.data === 'pong') return;
      try {
        const data = JSON.parse(event.data);
        if (data && data.channel) {
          this.emit(data.channel, data);
          this.emit('*', data); // Global wildcard channel
        }
      } catch (error) {
        console.error('WebSocket message parsing error:', error);
      }
    };

    this.socket.onclose = () => {
      console.log('WebSocket disconnected');
    };

    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  on(channel: string, callback: WebSocketCallback) {
    if (!this.listeners.has(channel)) {
      this.listeners.set(channel, new Set());
    }
    this.listeners.get(channel)?.add(callback);
  }

  off(channel: string, callback: WebSocketCallback) {
    this.listeners.get(channel)?.delete(callback);
  }

  private emit(channel: string, data: any) {
    const callbacks = this.listeners.get(channel);
    if (callbacks) {
      callbacks.forEach((cb) => cb(data));
    }
  }

  send(data: unknown) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data));
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}

export const wsClient = new WebSocketClient();
