import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ApiService } from 'src/app/services/api.service';

// Interfaz para los datos que recibirá el diálogo
export interface InspectionDialogData {
  inspectionId: number;
}

export interface InspectionData {
  id: number;
  empresa: string;
  fecha: string;
  hora: string;
  propietario: string;
  nombre_propietario: string;
  conductor: string;
  nombre_conductor: string;
  cedula_conductor: string;
  tipo_inspeccion: string;
  descripcion: string;
  unidad: string;
  placa: string;
  kilometraje: string;
  mecanico: string;
  cupo: string;
  observaciones: string;
  panapass: string;
  combustible: string;
  estado_inspeccion: string;
  usuario: string;
  fotos: string[];
  firma: number;
  alfombra: boolean;
  antena: boolean;
  caratradio: boolean;
  copasrines: boolean;
  extinguidor: boolean;
  formatocolis: boolean;
  gato: boolean;
  gps: boolean;
  lamparas: boolean;
  llantarepu: boolean;
  luzdelante: boolean;
  luztracera: boolean;
  pagomunici: boolean;
  pipa: boolean;
  placamunic: boolean;
  poliseguro: boolean;
  regisvehic: boolean;
  retrovisor: boolean;
  revisado: boolean;
  tapiceria: boolean;
  triangulo: boolean;
  vidrios: boolean;
}

@Component({
  selector: 'app-inspection-info-dialog',
  templateUrl: './inspection-info-dialog.component.html',
  styleUrls: ['./inspection-info-dialog.component.css'],
})
export class InspectionInfoDialogComponent {
  // Inyectamos MatDialogRef para controlar el diálogo y MAT_DIALOG_DATA para recibir datos
  inspectionData!: InspectionData;
  isLoading: boolean = true;

  constructor(
    public dialogRef: MatDialogRef<InspectionInfoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: InspectionDialogData,
    private apiService: ApiService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.getInspectionDetails(this.data.inspectionId);
  }

  getInspectionDetails(inspectionId: number): void {
    this.apiService
      .getData(`inspections/inspection_details/${inspectionId}`)
      .subscribe({
        next: (data: InspectionData) => {
          this.inspectionData = data;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error fetching inspection details:', error);
          this.openSnackbar('Error al obtener los detalles de la inspección.');
          this.closeDialog('');
        },
      });
  }

  // Método para obtener el texto del estado (sin funcionalidad, solo para el diseño)
  getStatusText(status: string): string {
    switch (status) {
      case 'PEN':
        return 'Pendiente';
      case 'FIN':
        return 'Finalizada';
      case 'SUS':
        return 'Suspendida';
      default:
        return status;
    }
  }

  // Método para extraer solo el código del propietario (antes del espacio y guión)
  getOwnerCode(ownerString: string): string {
    if (!ownerString) return '';
    // Extraer todo lo que está antes del espacio y guión
    const match = ownerString.match(/^([^\s-]+)/);
    return match ? match[1] : ownerString;
  }

  openSnackbar(message: string) {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
  }

  closeDialog(result: string): void {
    this.dialogRef.close(result);
  }
}
