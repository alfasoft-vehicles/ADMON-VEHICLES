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

interface vehiclePhotoInfo {
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
  selector: 'app-take-photo',
  templateUrl: './take-photo.component.html',
  styleUrls: ['./take-photo.component.css'],
})
export class TakePhotoComponent implements OnInit {
  @ViewChild(CameraComponent)
  cameraComponent!: CameraComponent;

  vehicles = new FormControl('');
  drivers = new FormControl({ value: '', disabled: true });
  options: vehicle[] = [];
  filteredOptions!: Observable<vehicle[]>;

  isLoadingVehicles = true;
  isLoadingvehiclePhotoInfo = false;
  selectedVehicle: boolean = false;
  photoDriver = false;

  vehiclePhotoInfo: vehiclePhotoInfo = {
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
    private dialogRef: MatDialogRef<TakePhotoComponent>,
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
    this.vehiclePhotoInfo = {
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

  getVehiclePhotoInfo(event: any) {
    if (event.option.value === undefined) {
      this.resetInfo();
      this.resetVehicleAutocomplete();
      return;
    }

    if (event && event.option.value !== undefined) {
      const selectedVehicle = event.option.value;
      const company = this.getCompany();
      this.isLoadingvehiclePhotoInfo = true;
      this.resetInfo();

      this.apiService
        .getData('driver/vehicle-data/' + company + '/' + selectedVehicle)
        .subscribe(
          (response: vehiclePhotoInfo) => {
            this.isLoadingvehiclePhotoInfo = false;
            this.vehiclePhotoInfo = response;
            this.drivers.setValue(response.driver_code);
            this.selectedVehicle = true;
          },
          (error) => {
            console.error('Error fetching vehicle info:', error);
            this.isLoadingvehiclePhotoInfo = false;
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

  viewCamera() {
    this.photoDriver = true;
  }

  savePhoto(photosBase64: string[]) {
    if (this.selectedVehicle && photosBase64.length > 0) {
      const data = {
        company_code: this.getCompany(),
        vehicle_number: this.vehiclePhotoInfo.vehicle_number,
        base64: photosBase64[0], // Solo tomar la primera foto
      };

      this.isLoadingVehicles = true;

      this.apiService.postData('driver/upload-picture', data).subscribe(
        (response: any) => {
          this.openSnackbar('Foto guardada exitosamente.');
          this.closeDialog();
        },
        (error) => {
          console.error('Error saving photo:', error);
          this.closeDialog();
        },
      );
    }
  }

  triggerSavePhoto() {
    if (this.cameraComponent) {
      const photos = this.cameraComponent.getPhotosBase64();
      this.savePhoto(photos);
    }
  }

  closeDialog() {
    this.dialogRef.close();
  }
}
