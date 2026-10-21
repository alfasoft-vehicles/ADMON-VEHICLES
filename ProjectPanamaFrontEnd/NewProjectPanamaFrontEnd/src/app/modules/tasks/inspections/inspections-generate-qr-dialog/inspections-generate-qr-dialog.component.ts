import { Component, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable } from 'rxjs/internal/Observable';
import { map } from 'rxjs/internal/operators/map';
import { startWith } from 'rxjs/internal/operators/startWith';
import { CameraComponent } from 'src/app/modules/shared/components/camera/camera/camera.component';
import { ApiService } from 'src/app/services/api.service';
import { JwtService } from 'src/app/services/jwt.service';

interface vehicle {
  unidad: string;
  placa: string;
  propietario: string;
  nro_cupo: string;
}

interface vehicleQRInfo {
  vehicle_number: string;
  model: string;
  plate: string;
  quota: string;
  central: string;
  owner_name: string;
  nro_delivery: string;
  daily_quota: number;
  deposit_value: number;
  state_name: string;
  has_quota: string;
  driver_code: string;
  driver_name: string;
  driver_id: string;
  driver_phone: string;
  driver_address: string;
  inspections: number;
}
@Component({
  selector: 'app-inspections-generate-qr-dialog',
  templateUrl: './inspections-generate-qr-dialog.component.html',
  styleUrls: ['./inspections-generate-qr-dialog.component.css'],
})
export class InspectionsGenerateQrDialogComponent implements OnInit {
  @ViewChild(CameraComponent)
  cameraComponent!: CameraComponent;

  vehicles = new FormControl('');
  drivers = new FormControl({ value: '', disabled: true });
  options: vehicle[] = [];
  filteredOptions!: Observable<vehicle[]>;

  isLoadingVehicles = true;
  isLoadingvehicleQRInfo = false;
  selectedVehicle: boolean = false;

  vehicleQRInfo: vehicleQRInfo = {
    vehicle_number: '',
    model: '',
    plate: '',
    quota: '',
    central: '',
    owner_name: '',
    nro_delivery: '',
    daily_quota: 0,
    deposit_value: 0,
    state_name: '',
    has_quota: '',
    driver_code: '',
    driver_name: '',
    driver_id: '',
    driver_phone: '',
    driver_address: '',
    inspections: 0,
  };

  constructor(
    private apiService: ApiService,
    private jwtService: JwtService,
    private snackBar: MatSnackBar,
    private dialogRef: MatDialogRef<InspectionsGenerateQrDialogComponent>,
  ) {}

  ngOnInit() {
    this.getVehicles();
  }

  getCompany() {
    const userData = this.jwtService.getUserData();
    return userData ? userData.empresa : '';
  }

  getVehicles() {
    const company = this.getCompany();
    this.apiService.getData('vehicles/' + company).subscribe(
      (response: vehicle[]) => {
        this.options = response;
        this.filteredOptions = this.vehicles.valueChanges.pipe(
          startWith(''),
          map((value) => this._filter(value || '')),
        );
        this.isLoadingVehicles = false;
      },
      (error) => {
        console.error('Error fetching vehicles:', error);
        this.isLoadingVehicles = false;
        this.closeDialog();
      },
    );
  }

  openSnackbar(message: string) {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3500,
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
  }

  resetInfo() {
    this.selectedVehicle = false;
    this.vehicleQRInfo = {
      vehicle_number: '',
      model: '',
      plate: '',
      quota: '',
      central: '',
      owner_name: '',
      nro_delivery: '',
      daily_quota: 0,
      deposit_value: 0,
      state_name: '',
      has_quota: '',
      driver_code: '',
      driver_name: '',
      driver_id: '',
      driver_phone: '',
      driver_address: '',
      inspections: 0,
    };
    this.drivers.setValue('');
  }

  resetVehicleAutocomplete() {
    // Resetear el autocomplete completamente
    this.vehicles.setValue('');
    this.vehicles.updateValueAndValidity();

    // Opcional: Forzar la actualización del filtro
    this.filteredOptions = this.vehicles.valueChanges.pipe(
      startWith(''),
      map((value) => this._filter(value || '')),
    );
  }

  getVehicleQRInfo(event: any) {
    if (event.option.value === undefined) {
      this.resetInfo();
      this.resetVehicleAutocomplete();
      return;
    }

    if (event && event.option.value !== undefined) {
      const selectedVehicle = event.option.value;
      const company = this.getCompany();
      this.isLoadingvehicleQRInfo = true;
      this.resetInfo();

      this.apiService
        .getData('inspections/vehicle_info/' + company + '/' + selectedVehicle)
        .subscribe(
          (response: vehicleQRInfo) => {
            this.isLoadingvehicleQRInfo = false;
            this.vehicleQRInfo = response;
            this.drivers.setValue(response.driver_code);
            this.selectedVehicle = true;
          },
          (error) => {
            console.error('Error fetching vehicle info:', error);
            this.isLoadingvehicleQRInfo = false;
            this.resetInfo();
            this.resetVehicleAutocomplete();
          },
        );
    }
  }

  private _filter(value: string): vehicle[] {
    const filterValue = value.toLowerCase();

    return this.options.filter(
      (option) =>
        option.placa.toLowerCase().includes(filterValue) ||
        option.unidad.toLowerCase().includes(filterValue) ||
        option.propietario.toLowerCase().includes(filterValue) ||
        option.nro_cupo.toLowerCase().includes(filterValue),
    );
  }

  generateQR() {
    if (this.vehicleQRInfo.vehicle_number === '') {
      this.openSnackbar('Por favor, seleccione una unidad para continuar.');
      return;
    }

    const company = this.getCompany();
    const vehicleNumber = this.vehicleQRInfo.vehicle_number;

    const endpoint = `inspections/generate_qr/${company}/${vehicleNumber}`;

    localStorage.setItem('pdfEndpoint', endpoint);

    window.open(`/pdf`, '_blank');
    this.closeDialog();
  }

  closeDialog() {
    this.dialogRef.close();
  }
}
