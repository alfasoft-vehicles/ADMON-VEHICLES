import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ApiService } from 'src/app/services/api.service';
import { Clipboard } from '@angular/cdk/clipboard';
import { JwtService } from 'src/app/services/jwt.service';

interface DialogData {
  vehicleNumber: string;
  driverCode: string;
}

interface VehicleInfo {
  numero_unidad: string;
  placa_vehiculo: string;
  nro_cupo: string;
  propietario: string;
  codigo_conductor: string;
  nombre_conductor: string;
  telefono_conductor: string;
  panapass: string;
  fecha_contrato: string;
  valor_cuota: number;
  numero_cuotas: number;
  cuotas_pagas: number;
  cuotas_pendientes: number;
}

@Component({
  selector: 'app-inspections-vehicle-info',
  templateUrl: './inspections-vehicle-info.component.html',
  styleUrls: ['./inspections-vehicle-info.component.css'],
})
export class InspectionsVehicleInfoComponent implements OnInit {
  isLoading: boolean = true;
  vehicle!: VehicleInfo;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    private dialogRef: MatDialogRef<InspectionsVehicleInfoComponent>,
    private apiService: ApiService,
    private snackBar: MatSnackBar,
    private clipboard: Clipboard,
    private jwtService: JwtService,
  ) {}

  ngOnInit(): void {
    this.getVehicleInfo();
  }

  getCompany() {
    const userData = this.jwtService.getUserData();
    return userData ? userData.empresa : '';
  }

  getVehicleInfo(): void {
    const company = this.getCompany();
    const postData = {
      driver_number: this.data.driverCode || '',
      vehicle_number: this.data.vehicleNumber || '',
    };
    this.apiService.postData('documents/info/' + company, postData).subscribe(
      (data) => {
        this.vehicle = data;
        this.isLoading = false;
      },
      (error) => {
        console.error('Error fetching vehicle info:', error);
        this.isLoading = false;
        this.closeModal();
      },
    );
  }

  openSnackbar(message: string) {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
  }

  copyToClipboard(text: string | number) {
    this.clipboard.copy(text.toString());
    this.openSnackbar('Copiado al portapapeles');
  }

  closeModal() {
    this.dialogRef.close();
  }
}
