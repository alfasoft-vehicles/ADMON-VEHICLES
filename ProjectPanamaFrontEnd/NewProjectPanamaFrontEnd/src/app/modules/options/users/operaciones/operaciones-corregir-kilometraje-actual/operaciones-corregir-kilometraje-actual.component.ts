import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  FormGroup,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { map, Observable, startWith } from 'rxjs';
import { ConfirmActionDialogComponent } from 'src/app/modules/shared/components/confirm-action-dialog/confirm-action-dialog.component';
import { ApiService } from 'src/app/services/api.service';
import { JwtService } from 'src/app/services/jwt.service';

interface vehicle {
  unidad: string;
  placa: string;
  propietario: string;
  nro_cupo: string;
}

interface vehicleInfo {
  numero: string;
  marca: string;
  placa: string;
  cupo: string;
  nro_entrega: string;
  cuota_diaria: string;
  estado: string;
  propietario: string;
  conductor: string;
  con_cupo: number; //1 ES SÍ, 2 ES NO
  fecha_estado: string;
}

interface driverInfo {
  codigo: string;
  nombre: string;
  cedula: string;
  telefono: string;
  direccion: string;
  licencia_numero: string;
  licencia_vencimiento: string;
  vehiculo: string;
  estado: string;
}

interface vehicleMileageResponse {
  mileage: number;
}

@Component({
  selector: 'app-operaciones-corregir-kilometraje-actual',
  templateUrl: './operaciones-corregir-kilometraje-actual.component.html',
  styleUrls: ['./operaciones-corregir-kilometraje-actual.component.css'],
})
export class OperacionesCorregirKilometrajeActualComponent {
  vehicles = new FormControl('');
  drivers = new FormControl({ value: '', disabled: true });
  options: vehicle[] = [];
  filteredOptions!: Observable<vehicle[]>;

  isLoadingVehicles: boolean = true;
  isLoadingVehicleInfo: boolean = false;
  selectedVehicle: boolean = false;
  isLoadingChange: boolean = false;

  infoChangeMileage!: FormGroup;

  vehicleData: vehicleInfo = {
    numero: '',
    marca: '',
    placa: '',
    cupo: '',
    nro_entrega: '',
    cuota_diaria: '',
    estado: '',
    propietario: '',
    conductor: '',
    con_cupo: 0, //1 ES SÍ, 2 ES NO
    fecha_estado: '',
  };

  driverData: driverInfo = {
    codigo: '',
    nombre: '',
    cedula: '',
    telefono: '',
    direccion: '',
    licencia_numero: '',
    licencia_vencimiento: '',
    vehiculo: '',
    estado: '',
  };

  constructor(
    private formBuilder: FormBuilder,
    private jwtService: JwtService,
    private apiService: ApiService,
    private snackBar: MatSnackBar,
    private dialogRef: MatDialogRef<OperacionesCorregirKilometrajeActualComponent>,
    private breakpointObserver: BreakpointObserver,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.formBuild();
    this.getVehicles();
    this.getCurrentMileage();
  }

  formBuild() {
    this.infoChangeMileage = this.formBuilder.group(
      {
        oldMileage: new FormControl(''),
        newMileage: new FormControl('', Validators.required),
      },
      {
        validators: this.mileageValidator,
      }
    );
  }

  mileageValidator(control: AbstractControl): ValidationErrors | null {
    const oldMileage = control.get('oldMileage')?.value;
    const newMileage = control.get('newMileage')?.value;

    if (newMileage !== '' && Number(oldMileage) === Number(newMileage)) {
      return { sameAsOld: true };
    }

    return null;
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
          map((value) => this._filter(value || ''))
        );
        this.isLoadingVehicles = false;
      },
      (error) => {
        console.error('Error fetching vehicles:', error);
        this.openSnackbar(
          'Error al obtener las unidades. Inténtalo de nuevo más tarde.'
        );
        this.closeDialog();
      }
    );
  }

  private _filter(value: string): vehicle[] {
    const filterValue = value.toLowerCase();

    return this.options.filter(
      (option) =>
        option.placa.toLowerCase().includes(filterValue) ||
        option.unidad.toLowerCase().includes(filterValue) ||
        option.propietario.toLowerCase().includes(filterValue) ||
        option.nro_cupo.toLowerCase().includes(filterValue)
    );
  }

  vehicleSearch(vehicleValue: string) {
    this.resetInfo();
    this.selectedVehicle = false;
    if (vehicleValue !== '') {
      this.isLoadingVehicleInfo = true;
      this.apiService
        .getData(`operations/deliveryvehicledriver/vehicle/${this.getCompany()}/${vehicleValue}`)
        .subscribe({
          next: (data: vehicleInfo) => {
            this.vehicleData = data;
            this.getCurrentMileage();
            this.drivers.setValue(this.vehicleData.conductor);
            this.driverSearch(this.vehicleData.conductor);
          },
          error: (error: HttpErrorResponse) => {
            this.isLoadingVehicleInfo = false;
            this.selectedVehicle = false;
            if (error.status === 404) {
              this.openSnackbar('Vehículo no encontrado. Intenta con otro.');
            } else {
              this.openSnackbar(
                'Error al obtener la información del vehículo. Inténtalo de nuevo más tarde.'
              );
            }
          },
        });
    }
  }

  driverSearch(driverValue: string) {
    if (driverValue !== '') {
      this.apiService
        .getData(`operations/deliveryvehicledriver/driver/${this.getCompany()}/${driverValue}`)
        .subscribe({
          next: (data: driverInfo) => {
            this.driverData = data;
            this.isLoadingVehicleInfo = false;
            this.selectedVehicle = true;
          },
          error: (error: HttpErrorResponse) => {
            this.isLoadingVehicleInfo = false;
            this.selectedVehicle = true;
            if (error.status === 404) {
              this.openSnackbar(
                'No se encontró el conductor para esta unidad.'
              );
            } else {
              this.openSnackbar(
                'Error al obtener la información del conductor. Inténtalo de nuevo más tarde.'
              );
            }
          },
        });
      return;
    }
    this.isLoadingVehicleInfo = false;
    this.selectedVehicle = true;
  }

  getCurrentMileage() {
    if (this.vehicleData.numero) {
      const company = this.getCompany();

      this.apiService
        .getData(
          `operations/vehicle-mileage/${company}/${this.vehicleData.numero}`
        )
        .subscribe({
          next: (data: vehicleMileageResponse) => {
            this.infoChangeMileage.patchValue({
              oldMileage: data.mileage,
            });
          },
          error: (error: HttpErrorResponse) => {
            console.error('Error fetching current mileage:', error);
            this.openSnackbar(
              'Error al obtener el kilometraje actual. Inténtalo de nuevo más tarde.'
            );
            this.closeDialog();
          },
        });
    }
  }

  onlyNumbers(event: KeyboardEvent): boolean {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      return false;
    }
    return true;
  }

  resetInfo() {
    this.selectedVehicle = false;
    this.vehicleData = {
      numero: '',
      marca: '',
      placa: '',
      cupo: '',
      nro_entrega: '',
      cuota_diaria: '',
      estado: '',
      propietario: '',
      conductor: '',
      con_cupo: 0, //1 ES SÍ, 2 ES NO
      fecha_estado: '',
    };
    this.driverData = {
      codigo: '',
      nombre: '',
      cedula: '',
      telefono: '',
      direccion: '',
      licencia_numero: '',
      licencia_vencimiento: '',
      vehiculo: '',
      estado: '',
    };
    this.infoChangeMileage.reset();
  }

  openConfirmationDialog() {
    if (this.infoChangeMileage.invalid || !this.selectedVehicle) {
      this.openSnackbar('Por favor, completa todos los campos obligatorios.');
      this.infoChangeMileage.markAllAsTouched();
      return;
    }

    const oldMileage = this.infoChangeMileage.get('oldMileage')?.value;

    if (oldMileage !== '') {
      var message = `¿Estás seguro de que deseas cambiar el kilometraje del vehículo ${
        this.vehicleData.numero
      } - ${this.vehicleData.placa} de ${this.infoChangeMileage.get('oldMileage')?.value} a ${
        this.infoChangeMileage.get('newMileage')?.value
      }?`;
    } else {
      var message = `¿Estás seguro de que deseas cambiar el kilometraje del vehículo ${
        this.vehicleData.numero
      } - ${this.vehicleData.placa} a ${
        this.infoChangeMileage.get('newMileage')?.value
      }?`;
    }

    const isSmallScreen = this.breakpointObserver.isMatched(Breakpoints.Small);
    const isXsmallScreen = this.breakpointObserver.isMatched(
      Breakpoints.XSmall
    );
    const dialogWidth = isSmallScreen || isXsmallScreen ? '90vw' : '60%';

    const dialogRef = this.dialog.open(ConfirmActionDialogComponent, {
      data: {
        documentName: 'Corregir Kilometraje Actual al Vehículo',
        message: message,
      },
      width: dialogWidth,
    });

    dialogRef.afterClosed().subscribe((confirmation: boolean) => {
      if (confirmation) {
        this.isLoadingChange = true;
        this.changeMileageVehicle();
      } else {
        this.openSnackbar('Operación cancelada.');
      }
    });
  }

  changeMileageVehicle() {
    const company = this.getCompany();

    const valuesSave = {
      company_code: company,
      vehicle_number: this.vehicleData.numero,
      mileage: this.infoChangeMileage.get('newMileage')?.value
    }

    this.apiService.postData('operations/update-vehicle-mileage', valuesSave).subscribe({
      next: (response) => {
        this.openSnackbar('Kilometraje actualizado correctamente.');
        this.closeDialog();
      }
      ,
      error: (error: HttpErrorResponse) => {
        this.isLoadingChange = false;
        this.openSnackbar(
          'Error al actualizar el kilometraje. Inténtalo de nuevo más tarde.'
        );
      }
    });
  }

  resetAutocomplete() {
    this.vehicles.setValue('');
  }

  openSnackbar(message: string) {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3500,
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
  }

  closeDialog() {
    this.dialogRef.close();
  }
}
