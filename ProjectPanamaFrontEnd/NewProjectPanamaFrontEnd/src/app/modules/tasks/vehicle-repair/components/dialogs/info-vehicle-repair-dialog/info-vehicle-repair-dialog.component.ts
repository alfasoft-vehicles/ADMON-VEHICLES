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
    // TODO: Replace with actual API endpoint when available
    // For now, using mock data for development
    setTimeout(() => {
      this.vehicleRepairData = {
        id: vehicleRepairId,
        empresa: 'TOTAL TAXI PANAMA S.A.',
        fecha: '26-01-2026',
        hora: '18:05',
        propietario: '001 - TOTAL TAXI PANAMA S.A.',
        nombre_propietario: 'TOTAL TAXI PANAMA S.A.',
        unidad: 'TT232',
        placa: 'EE9910',
        cupo: '8RIO487',
        descripcion: 'Reparación de frenos y suspensión',
        patio: 'PATIO PRINCIPAL',
        usuario: 'HECTOR F. VANECAS G.',
        estado: 'PEN',
        fotos: ['foto1.jpg', 'foto2.jpg'],
        qr: 1,
      };
      this.isLoading = false;
    }, 300);

    // Uncomment when API is ready:
    // this.apiService
    //   .getData(`vehicle-repair/details/${vehicleRepairId}`)
    //   .subscribe({
    //     next: (data: VehicleRepairDetails) => {
    //       this.vehicleRepairData = data;
    //       this.isLoading = false;
    //     },
    //     error: (error) => {
    //       console.error('Error fetching vehicle repair details:', error);
    //       this.openSnackbar('Error al obtener los detalles del vehículo a reparar.');
    //       this.closeDialog('');
    //     },
    //   });
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'PEN':
        return 'Pendiente';
      case 'FIN':
        return 'Finalizado';
      case 'SUS':
        return 'Suspendido';
      default:
        return status;
    }
  }

  getOwnerCode(ownerString: string): string {
    if (!ownerString) return '';
    const match = ownerString.match(/^([^\s-]+)/);
    return match ? match[1] : ownerString;
  }

  getPatioCode(patioString: string): string {
    if (!patioString) return 'N/A';
    // Extract code if format is "CODE - NAME", otherwise return first part
    const match = patioString.match(/^([^\s-]+)/);
    return match ? match[1] : patioString;
  }

  toggleDescription(): void {
    this.isDescriptionExpanded = !this.isDescriptionExpanded;
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
