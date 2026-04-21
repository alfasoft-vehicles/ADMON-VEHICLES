import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ApiService } from 'src/app/services/api.service';

// Interface for dialog input data
export interface VehicleRepairDialogData {
  vehicleRepairId: number;
}

// Interface for vehicle repair details
export interface VehicleRepairDetails {
  id: number;
  empresa: string;
  fecha: string;
  hora: string;
  propietario: string;
  nombre_propietario: string;
  unidad: string;
  placa: string;
  cupo: string;
  descripcion: string;
  patio: string;
  usuario: string;
  estado: string;
  fotos: string[];
  qr: number;
  notasfin?: string;
}

@Component({
  selector: 'app-info-vehicle-repair-dialog',
  templateUrl: './info-vehicle-repair-dialog.component.html',
  styleUrls: ['./info-vehicle-repair-dialog.component.css'],
})
export class InfoVehicleRepairDialogComponent implements OnInit {
  vehicleRepairData!: VehicleRepairDetails;
  isLoading: boolean = true;
  isDescriptionExpanded: boolean = false;
  isNotesExpanded: boolean = false;

  constructor(
    public dialogRef: MatDialogRef<InfoVehicleRepairDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: VehicleRepairDialogData,
    private apiService: ApiService,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.getVehicleRepairDetails(this.data.vehicleRepairId);
  }

  getVehicleRepairDetails(vehicleRepairId: number): void {
    this.apiService
      .getData(`vehicles_to_repair/repair_details/${vehicleRepairId}`)
      .subscribe({
        next: (data: VehicleRepairDetails) => {
          this.vehicleRepairData = data;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error fetching vehicle repair details:', error);
          this.openSnackbar(
            'Error al obtener los detalles del vehículo a reparar.',
          );
          this.closeDialog('');
        },
      });
  }

  openDocumentPDF(entryId: number) {
    this.apiService
      .getData(`vehicles_to_repair/get_pdf_url/${entryId}`)
      .subscribe({
        next: (response: any) => {
          if (response.url) {
            window.open(response.url, '_blank');
          } else {
            this.openSnackbar('No se encontró la URL del documento.');
          }
        },
        error: (error) => {
          console.error('Error fetching PDF URL:', error);
          this.openSnackbar('Error al obtener el documento.');
        },
      });
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'PEN':
        return 'Pendiente';
      case 'FIN':
        return 'Finalizado';
      case 'SUS':
        return 'Suspendido';
      case 'TER':
        return 'Retirado';
      default:
        return status;
    }
  }

  getOwnerCode(ownerString: string): string {
    if (!ownerString) return '';
    const match = ownerString.match(/^([^\s-]+)/);
    return match ? match[1] : ownerString;
  }

  getYardCode(patioString: string): string {
    if (!patioString) return 'N/A';
    const match = patioString.match(/^([^\s-]+)/);
    return match ? match[1] : patioString;
  }

  getYardName(patioString: string): string {
    if (!patioString) return 'N/A';
    const separatorIndex = patioString.indexOf(' - ');
    return separatorIndex !== -1
      ? patioString.substring(separatorIndex + 3).trim()
      : patioString;
  }

  toggleDescription(): void {
    this.isDescriptionExpanded = !this.isDescriptionExpanded;
  }

  toggleNotes(): void {
    this.isNotesExpanded = !this.isNotesExpanded;
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
