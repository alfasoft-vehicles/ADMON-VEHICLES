import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BulkUploadService } from '../../services/bulk-upload.service';

export interface BankOption {
  id: string;
  type: string;
  name: string;
  badge: string;
  subtext: string;
  icon: string;
  color: string;
  gradient: string;
}

@Component({
  selector: 'app-select-bank-dialog',
  templateUrl: './select-bank-dialog.component.html',
  styleUrls: ['./select-bank-dialog.component.css'],
})
export class SelectBankDialogComponent {
  currentStep: 1 | 2 = 1;

  // Opciones de pasarelas / bancos (4 variantes iniciales basadas en Yappy)
  bankOptions: BankOption[] = [
    {
      id: 'yappy-comercial',
      type: 'yappy',
      name: 'Yappy Comercial',
      badge: 'BANCO GENERAL',
      subtext: 'Conciliación de pagos móviles P2P, números celular y QR',
      icon: 'payments',
      color: '#0077c8',
      gradient: 'linear-gradient(135deg, #0077c8 0%, #00a4e4 100%)',
    },
    {
      id: 'yappy-corporativo',
      type: 'yappy',
      name: 'Yappy Corporativo',
      badge: 'BANCO GENERAL',
      subtext: 'Lotes bancarios de cuentas maestras y recaudos en línea',
      icon: 'account_balance',
      color: '#0284c7',
      gradient: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
    },
    {
      id: 'yappy-pos',
      type: 'yappy',
      name: 'Yappy Enlace / POS',
      badge: 'BANCO GENERAL',
      subtext: 'Cobros centralizados mediante enlaces y pasarela web',
      icon: 'qr_code_scanner',
      color: '#0369a1',
      gradient: 'linear-gradient(135deg, #0369a1 0%, #0ea5e9 100%)',
    },
    {
      id: 'yappy-express',
      type: 'yappy',
      name: 'Yappy Express',
      badge: 'BANCO GENERAL',
      subtext: 'Liquidaciones rápidas y turnos diarios de conductores',
      icon: 'bolt',
      color: '#0f766e',
      gradient: 'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)',
    },
  ];

  selectedBank: BankOption | null = null;
  selectedFile: File | null = null;
  isDragging: boolean = false;
  isUploading: boolean = false;

  constructor(
    private dialogRef: MatDialogRef<SelectBankDialogComponent>,
    private router: Router,
    private snackBar: MatSnackBar,
    private bulkUploadService: BulkUploadService,
  ) {}

  selectBank(bank: BankOption): void {
    this.selectedBank = bank;
  }

  nextStep(): void {
    if (this.selectedBank) {
      this.currentStep = 2;
    }
  }

  previousStep(): void {
    this.currentStep = 1;
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onFileDropped(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFile(input.files[0]);
    }
  }

  private handleFile(file: File): void {
    if (file.name.toLowerCase().endsWith('.csv') || file.type.includes('csv')) {
      this.selectedFile = file;
    } else {
      // Acepta el archivo igualmente para pruebas
      this.selectedFile = file;
    }
  }

  removeFile(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.selectedFile = null;
  }

  formatFileSize(bytes?: number): string {
    if (!bytes) return '0 KB';
    const kb = bytes / 1024;
    if (kb < 1024) {
      return `${kb.toFixed(1)} KB`;
    }
    return `${(kb / 1024).toFixed(2)} MB`;
  }

  submitUpload(): void {
    if (!this.selectedBank) {
      return;
    }

    this.isUploading = true;

    // Delegamos al patrón strategy a través del servicio
    this.bulkUploadService
      .uploadFile(this.selectedBank.type, this.selectedFile)
      .subscribe({
        next: (result) => {
          this.isUploading = false;
          this.dialogRef.close(true);

          // Redirección hacia la vista universal bulk-upload con su :type correspondiente
          this.router.navigate([
            '/cash-register/bulk-upload',
            this.selectedBank!.type,
          ]);

          this.snackBar.open(
            `Banco ${this.selectedBank!.name} seleccionado. Conciliación lista.`,
            'Entendido',
            {
              duration: 3500,
              horizontalPosition: 'center',
              verticalPosition: 'top',
            },
          );
        },
        error: (err) => {
          this.isUploading = false;
          this.snackBar.open(
            'Ocurrió un error al procesar el archivo. Inténtelo nuevamente.',
            'Cerrar',
            {
              duration: 4000,
              horizontalPosition: 'center',
              verticalPosition: 'top',
            },
          );
        },
      });
  }

  close(): void {
    this.dialogRef.close(false);
  }
}
