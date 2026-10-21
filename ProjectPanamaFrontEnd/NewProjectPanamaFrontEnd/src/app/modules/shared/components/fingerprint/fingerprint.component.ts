import {
  Component,
  OnInit,
  OnDestroy,
  Output,
  EventEmitter,
} from '@angular/core';
import { Subscription } from 'rxjs';
import {
  FingerprintService,
  FingerprintMessage,
} from '../../services/fingerprint.service';

@Component({
  selector: 'app-fingerprint',
  templateUrl: './fingerprint.component.html',
  styleUrls: ['./fingerprint.component.css'],
})
export class FingerprintComponent implements OnInit, OnDestroy {
  @Output() fingerprintCaptured = new EventEmitter<string>();

  statusMessage: string = 'Iniciando conexión con el lector...';
  fingerprintBase64: string = '';
  isCapturing: boolean = false;
  isConnected: boolean = false;
  hasError: boolean = false;

  private subscriptions: Subscription = new Subscription();

  constructor(private fingerprintService: FingerprintService) {}

  ngOnInit(): void {
    // 1. Subscribe to connection status
    this.subscriptions.add(
      this.fingerprintService.isConnected$.subscribe((connected) => {
        this.isConnected = connected;
        if (connected) {
          this.statusMessage =
            'Lector listo. Presione el botón para iniciar captura.';
          this.hasError = false;
        } else {
          this.statusMessage = 'Desconectado del agente de huella.';
        }
      }),
    );

    // 2. Subscribe to incoming messages/events
    this.subscriptions.add(
      this.fingerprintService.onMessage$.subscribe(
        (msg: FingerprintMessage) => {
          this.handleMessage(msg);
        },
      ),
    );

    // 3. Auto-connect
    this.connectAgent();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.fingerprintService.disconnect();
  }

  public connectAgent(): void {
    this.fingerprintService.connect();
  }

  public startCapture(): void {
    if (!this.isConnected) {
      this.statusMessage = 'No se puede iniciar captura: Agente no conectado.';
      return;
    }
    this.isCapturing = true;
    this.hasError = false;
    this.fingerprintBase64 = '';
    this.fingerprintService.startCapture();
  }

  public retryConnection(): void {
    this.statusMessage = 'Reintentando conexión con el lector...';
    this.connectAgent();
  }

  private handleMessage(msg: FingerprintMessage): void {
    switch (msg.event) {
      case 'status_changed':
        if (msg.status === 'waiting_finger') {
          this.statusMessage = 'Coloque el dedo sobre el lector de huellas...';
        }
        break;
      case 'capture_success':
        this.isCapturing = false;
        if (msg.data) {
          this.fingerprintBase64 = msg.data;
          this.statusMessage = 'Huella capturada con éxito.';
          this.fingerprintCaptured.emit(this.fingerprintBase64);
        }
        break;
      case 'capture_error':
        this.isCapturing = false;
        this.hasError = true;
        this.statusMessage =
          msg.message || 'Error desconocido al capturar la huella.';
        break;
    }
  }
}
