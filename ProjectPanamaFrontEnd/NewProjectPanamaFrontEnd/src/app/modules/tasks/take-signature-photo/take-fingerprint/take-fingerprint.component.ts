import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { ApiService } from 'src/app/services/api.service';
import { JwtService } from 'src/app/services/jwt.service';

interface vehicle {
  unidad: string;
  placa: string;
  propietario: string;
  nro_cupo: string;
}

interface vehicleFingerprintInfo {
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
  has_signature: number;
  has_picture: number;
  has_vehicle_photo: number;
  has_fingerprint: number;
}

@Component({
  selector: 'app-take-fingerprint-task',
  templateUrl: './take-fingerprint.component.html',
  styleUrls: ['./take-fingerprint.component.css'],
})
export class TakeFingerprintComponent implements OnInit {
  vehicles = new FormControl('');
  drivers = new FormControl({ value: '', disabled: true });
  options: vehicle[] = [];
  filteredOptions!: Observable<vehicle[]>;

  isLoadingVehicles = true;
  isLoadingvehicleFingerprintInfo = false;
  selectedVehicle: boolean = false;
  fingerprintDriver = false;
  tempFingerprintBase64: string = '';

  vehicleFingerprintInfo: vehicleFingerprintInfo = {
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
    has_signature: 0,
    has_picture: 0,
    has_vehicle_photo: 0,
    has_fingerprint: 0,
  };

  constructor(
    private apiService: ApiService,
    private jwtService: JwtService,
    private snackBar: MatSnackBar,
    private dialogRef: MatDialogRef<TakeFingerprintComponent>,
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
        this.openSnackbar(
          'Error al obtener las unidades. Inténtalo de nuevo más tarde.',
        );
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
    this.tempFingerprintBase64 = '';
    this.vehicleFingerprintInfo = {
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
      has_signature: 0,
      has_picture: 0,
      has_vehicle_photo: 0,
      has_fingerprint: 0,
    };
    this.drivers.setValue('');
  }

  resetVehicleAutocomplete() {
    this.vehicles.setValue('');
    this.vehicles.updateValueAndValidity();
    this.filteredOptions = this.vehicles.valueChanges.pipe(
      startWith(''),
      map((value) => this._filter(value || '')),
    );
  }

  getVehicleFingerprintInfo(event: any) {
    if (event.option.value === undefined) {
      this.resetInfo();
      this.resetVehicleAutocomplete();
      return;
    }

    if (event && event.option.value !== undefined) {
      const selectedVehicle = event.option.value;
      const company = this.getCompany();
      this.isLoadingvehicleFingerprintInfo = true;
      this.resetInfo();

      this.apiService
        .getData('driver/vehicle-data/' + company + '/' + selectedVehicle)
        .subscribe(
          (response: vehicleFingerprintInfo) => {
            this.isLoadingvehicleFingerprintInfo = false;
            this.vehicleFingerprintInfo = response;
            this.drivers.setValue(response.driver_code);
            this.selectedVehicle = true;
          },
          (error) => {
            console.error('Error fetching driver vehicle data:', error);
            this.openSnackbar(
              'Error al obtener la información. Inténtalo de nuevo con otra unidad.',
            );
            this.isLoadingvehicleFingerprintInfo = false;
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

  viewFingerprint() {
    this.fingerprintDriver = true;
  }

  onFingerprintCaptured(fingerprintBase64: string) {
    this.tempFingerprintBase64 = fingerprintBase64;
  }

  triggerSaveFingerprint() {
    if (this.tempFingerprintBase64) {
      this.saveFingerprint(this.tempFingerprintBase64);
    } else {
      this.openSnackbar('Por favor capture la huella primero.');
    }
  }

  saveFingerprint(fingerprintBase64: string) {
    if (this.selectedVehicle && fingerprintBase64) {
      const data = {
        company_code: this.getCompany(),
        cedula: this.vehicleFingerprintInfo.driver_id,
        base64: fingerprintBase64,
      };

      this.isLoadingVehicles = true;

      this.apiService
        .postData('driver/upload-fingerprint-photo', data)
        .subscribe(
          (response: any) => {
            this.openSnackbar('Huella guardada exitosamente.');
            this.closeDialog();
          },
          (error) => {
            console.error('Error saving fingerprint:', error);
            this.openSnackbar(
              'Error al guardar la huella. Inténtalo de nuevo.',
            );
            this.closeDialog();
          },
        );
    }
  }

  closeDialog() {
    this.dialogRef.close();
  }
}
