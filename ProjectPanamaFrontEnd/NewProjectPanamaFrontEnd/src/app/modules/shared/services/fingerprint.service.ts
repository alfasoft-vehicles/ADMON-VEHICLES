import { Injectable } from '@angular/core';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { BehaviorSubject, Subject } from 'rxjs';

export interface FingerprintMessage {
  event: 'status_changed' | 'capture_success' | 'capture_error';
  status?: string;
  data?: string;
  message?: string;
}

@Injectable({
  providedIn: 'root',
})
export class FingerprintService {
  private socket$: WebSocketSubject<any> | null = null;
  private isConnectedSubject = new BehaviorSubject<boolean>(false);
  private messageSubject = new Subject<FingerprintMessage>();

  public isConnected$ = this.isConnectedSubject.asObservable();
  public onMessage$ = this.messageSubject.asObservable();

  private readonly wsUrl = 'ws://localhost:8010/ws/fingerprint';

  constructor() {}

  public connect(): void {
    if (this.socket$ && !this.socket$.closed) {
      return;
    }

    try {
      this.socket$ = webSocket({
        url: this.wsUrl,
        openObserver: {
          next: () => {
            console.log('Fingerprint Agent WebSocket connected.');
            this.isConnectedSubject.next(true);
          },
        },
        closeObserver: {
          next: () => {
            console.log('Fingerprint Agent WebSocket closed.');
            this.isConnectedSubject.next(false);
            this.socket$ = null;
          },
        },
      });

      this.socket$.subscribe({
        next: (msg: FingerprintMessage) => {
          this.messageSubject.next(msg);
        },
        error: (err) => {
          console.error('Fingerprint Agent WebSocket connection error:', err);
          this.isConnectedSubject.next(false);
          this.messageSubject.next({
            event: 'capture_error',
            message:
              'No se pudo conectar al agente local. Verifique que FingerprintAgent.exe esté ejecutándose.',
          });
          this.socket$ = null;
        },
      });
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      this.isConnectedSubject.next(false);
      this.messageSubject.next({
        event: 'capture_error',
        message: 'Error al inicializar la conexión con el lector.',
      });
    }
  }

  public startCapture(): void {
    if (this.socket$ && !this.socket$.closed) {
      this.socket$.next({ command: 'start_capture' });
    } else {
      console.warn('Cannot start capture: WebSocket is not connected.');
      this.messageSubject.next({
        event: 'capture_error',
        message: 'No hay conexión con el agente de huella.',
      });
    }
  }

  public disconnect(): void {
    if (this.socket$) {
      this.socket$.complete();
      this.socket$ = null;
      this.isConnectedSubject.next(false);
    }
  }
}
