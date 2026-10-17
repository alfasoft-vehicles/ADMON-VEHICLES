import { Component, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable } from 'rxjs/internal/Observable';
import { map } from 'rxjs/internal/operators/map';
import { startWith } from 'rxjs/internal/operators/startWith';
import { SignaturePadComponent } from 'src/app/modules/shared/components/signature-pad/signature-pad.component';
import { ApiService } from 'src/app/services/api.service';
import { JwtService } from 'src/app/services/jwt.service';

interface vehicle {
  unidad: string;
  placa: string;
  propietario: string;
  nro_cupo: string;
}

interface vehicleSignatureInfo {
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
}

@Component({
  selector: 'app-take-signature',
  templateUrl: './take-signature.component.html',
  styleUrls: ['./take-signature.component.css'],
})
export class TakeSignatureComponent implements OnInit {
  @ViewChild(SignaturePadComponent)
  signaturePadComponent!: SignaturePadComponent;

  vehicles = new FormControl('');
  drivers = new FormControl({ value: '', disabled: true });
  options: vehicle[] = [];
  filteredOptions!: Observable<vehicle[]>;

  isLoadingVehicles = true;
  isLoadingvehicleSignatureInfo = false;
  selectedVehicle: boolean = false;
  signatureDriver = false;

  vehicleSignatureInfo: vehicleSignatureInfo = {
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
  };

  constructor(
    private apiService: ApiService,
    private jwtService: JwtService,
    private snackBar: MatSnackBar,
    private dialogRef: MatDialogRef<TakeSignatureComponent>,
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
    this.vehicleSignatureInfo = {
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

  getVehicleSignatureInfo(event: any) {
    if (event.option.value === undefined) {
      this.resetInfo();
      this.resetVehicleAutocomplete();
      return;
    }

    if (event && event.option.value !== undefined) {
      const selectedVehicle = event.option.value;
      const company = this.getCompany();
      this.isLoadingvehicleSignatureInfo = true;
      this.resetInfo();

      this.apiService
        .getData('driver/vehicle-data/' + company + '/' + selectedVehicle)
        .subscribe(
          (response: vehicleSignatureInfo) => {
            this.isLoadingvehicleSignatureInfo = false;
            this.vehicleSignatureInfo = response;
            this.drivers.setValue(response.driver_code);
            this.selectedVehicle = true;
          },
          (error) => {
            console.error('Error fetching contract info:', error);
            this.isLoadingvehicleSignatureInfo = false;
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

  viewSignaturePad() {
    this.signatureDriver = true;
  }

  saveSignature(signatureBase64: string) {
    if (this.selectedVehicle && signatureBase64) {
      const data = {
        company_code: this.getCompany(),
        vehicle_number: this.vehicleSignatureInfo.vehicle_number,
        base64: signatureBase64,
      };

      this.isLoadingVehicles = true;

      this.apiService.postData('driver/upload-signature', data).subscribe(
        (response: any) => {
          this.openSnackbar('Firma guardada exitosamente.');
          this.closeDialog();
        },
        (error) => {
          console.error('Error saving signature:', error);
          this.closeDialog();
        },
      );
    }
  }

  triggerSaveSignature() {
    if (this.signaturePadComponent) {
      this.signaturePadComponent.saveSignature();
    }
  }

  closeDialog() {
    this.dialogRef.close();
  }
}
