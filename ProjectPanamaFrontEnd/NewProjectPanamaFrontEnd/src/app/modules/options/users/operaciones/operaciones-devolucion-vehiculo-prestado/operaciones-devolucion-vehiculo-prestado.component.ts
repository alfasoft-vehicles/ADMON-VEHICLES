import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { map, Observable, startWith } from 'rxjs';
import { ConfirmActionDialogComponent } from 'src/app/modules/shared/components/confirm-action-dialog/confirm-action-dialog.component';
import { ApiService } from 'src/app/services/api.service';
import { JwtService } from 'src/app/services/jwt.service';

interface vehicleLoan {
  vehicle_number: string;
  vehicle_plate: string;
  owner: string;
  quota_number: string;
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
  vehiculo_original: string;
  estado: string;
}

interface objSelect {
  id: string;
  name: string;
}

interface validationsVehicleResponse {
  state: 0 | 1;
}

interface validationsVehicle {
  state: boolean;
  original_vehicle?: boolean;
}

@Component({
  selector: 'app-operaciones-devolucion-vehiculo-prestado',
  templateUrl: './operaciones-devolucion-vehiculo-prestado.component.html',
  styleUrls: ['./operaciones-devolucion-vehiculo-prestado.component.css'],
})
export class OperacionesDevolucionVehiculoPrestadoComponent {
  vehicles = new FormControl('');
  drivers = new FormControl({ value: '', disabled: true });
  options: vehicleLoan[] = [];
  filteredOptions!: Observable<vehicleLoan[]>;

  infoVehicleLoan!: FormGroup;

  isLoadingVehicles: boolean = true;
  isLoadingVehicleInfo: boolean = false;
  selectedVehicle: boolean = false;
  isLoadingChange: boolean = false;
  unauthorizedVehicle: boolean = false;
  validationVehicle: boolean = false;

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
    vehiculo_original: '',
    estado: '',
  };

  originalVehicleData: vehicleInfo = {
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

  validationsVehicle: validationsVehicle = {
    state: false,
    original_vehicle: false,
  };

  constructor(
    private formBuilder: FormBuilder,
    private jwtService: JwtService,
    private apiService: ApiService,
    private snackBar: MatSnackBar,
    private dialogRef: MatDialogRef<OperacionesDevolucionVehiculoPrestadoComponent>,
    private dialog: MatDialog,
    private breakpointObserver: BreakpointObserver
  ) {}

  ngOnInit() {
    this.getVehiclesLoan();
    this.formBuild();
  }

  formBuild() {
    this.infoVehicleLoan = this.formBuilder.group({
      loanVehicle: [{ value: '', disabled: true }, Validators.required],
      reason: ['', Validators.required],
    });
  }

  getCompany() {
    const userData = this.jwtService.getUserData();
    return userData ? userData.empresa : '';
  }

  getVehiclesLoan() {
    const company = this.getCompany();
    const state_code = '19';

    this.apiService
      .getData('vehicles-by-state/' + company + '/' + state_code)
      .subscribe(
        (response: vehicleLoan[]) => {
          this.options = response;
          this.filteredOptions = this.vehicles.valueChanges.pipe(
            startWith(''),
            map((value) => this._filter(value || ''))
          );
          this.isLoadingVehicles = false;
        },
        (error) => {
          this.openSnackbar(
            'Error al obtener las unidades para préstamo. Inténtalo de nuevo más tarde.'
          );
          this.closeDialog();
        }
      );
  }

  private _filter(value: string): vehicleLoan[] {
    const filterValue = value.toLowerCase();

    return this.options.filter(
      (option) =>
        option.vehicle_plate.toLowerCase().includes(filterValue) ||
        option.vehicle_number.toLowerCase().includes(filterValue) ||
        option.owner.toLowerCase().includes(filterValue) ||
        option.quota_number.toLowerCase().includes(filterValue)
    );
  }

  vehicleSearch(vehicleValue: string) {
    this.resetInfo();
    this.selectedVehicle = false;
    this.validationVehicle = true;
    if (vehicleValue !== '') {
      this.isLoadingVehicleInfo = true;
      this.apiService
        .getData(`operations/deliveryvehicledriver/vehicle/${this.getCompany()}/${vehicleValue}`)
        .subscribe({
          next: (data: vehicleInfo) => {
            this.vehicleData = data;
            this.drivers.setValue(this.vehicleData.conductor);
            this.driverSearch(this.vehicleData.conductor, vehicleValue);
          },
          error: (error: HttpErrorResponse) => {
            this.isLoadingVehicleInfo = false;
            this.selectedVehicle = false;
            this.validationVehicle = false;
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

  getValidationsVehicle(vehicleValue: string) {
    if (vehicleValue !== '') {
      const company = this.getCompany();
      this.apiService
        .getData(
          `operations/return-vehicle/validation/${company}/${vehicleValue}`
        )
        .subscribe({
          next: (data: validationsVehicleResponse) => {
            this.validationsVehicle.state = data.state === 0;
            this.validationsVehicle.original_vehicle =
              this.driverData.vehiculo_original === '';

            if (this.validationsVehicle.state) {
              this.openSnackbar(
                'El vehículo no tiene un estado válido para la devolución.'
              );
              this.unauthorizedVehicle = true;
            }

            if (this.validationsVehicle.original_vehicle) {
              this.openSnackbar(
                'El vehículo no tiene un vehículo original asignado.'
              );
              this.unauthorizedVehicle = true;
            }
          },
          error: (error: HttpErrorResponse) => {
            if (error.status === 404) {
              this.openSnackbar('Validación de vehículo no encontrada.');
            } else {
              this.openSnackbar(
                'Error al obtener la validación del vehículo. Inténtalo de nuevo más tarde.'
              );
            }
          },
        });
    }
  }

  driverSearch(driverValue: string, vehicleValue: string) {
    if (driverValue !== '') {
      this.apiService
        .getData(`operations/deliveryvehicledriver/driver/${this.getCompany()}/${driverValue}`)
        .subscribe({
          next: (data: driverInfo) => {
            this.driverData = data;
            if (this.driverData.vehiculo_original === '') {
              this.isLoadingVehicleInfo = false;
              this.selectedVehicle = true;
              this.openSnackbar(
                'El conductor no tiene un vehículo original asignado.'
              );
              this.unauthorizedVehicle = true;
              return;
            }

            this.getValidationsVehicle(vehicleValue);

            this.infoVehicleLoan
              .get('loanVehicle')
              ?.setValue(this.driverData.vehiculo_original);

            this.originalVehicleSearch(this.driverData.vehiculo_original);
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

  originalVehicleSearch(vehicle_number: string) {
    this.apiService
      .getData(`operations/deliveryvehicledriver/vehicle/${this.getCompany()}/${vehicle_number}`)
      .subscribe({
        next: (data: vehicleInfo) => {
          this.originalVehicleData = data;
          this.isLoadingVehicleInfo = false;
          this.selectedVehicle = true;
          this.validationVehicle = false;
        },
        error: (error: HttpErrorResponse) => {
          this.isLoadingVehicleInfo = false;
          this.selectedVehicle = false;
          this.validationVehicle = false;
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

  displayAutocomplete(obj: objSelect): string {
    return obj && obj.name ? obj.name : '';
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
      vehiculo_original: '',
      estado: '',
    };
    this.infoVehicleLoan.reset();
    this.drivers.setValue('');
    this.unauthorizedVehicle = false;
    this.validationsVehicle = {
      state: false,
    };
    this.validationVehicle = false;
  }

  resetAutocomplete(type: number) {
    if (type === 0) {
      this.vehicles.setValue('');
    } else if (type === 1) {
      this.infoVehicleLoan.get('loanVehicle')?.setValue('');
    }
  }

  openConfirmationDialog() {
    if (this.infoVehicleLoan.invalid || !this.selectedVehicle) {
      this.openSnackbar('Por favor, completa todos los campos obligatorios.');
      this.infoVehicleLoan.markAllAsTouched();
      return;
    }

    const isSmallScreen = this.breakpointObserver.isMatched(Breakpoints.Small);
    const isXsmallScreen = this.breakpointObserver.isMatched(
      Breakpoints.XSmall
    );
    const dialogWidth = isSmallScreen || isXsmallScreen ? '90vw' : '60%';

    const dialogRef = this.dialog.open(ConfirmActionDialogComponent, {
      data: {
        documentName: 'Devolución de Vehículos Prestados',
        message: `¿Estás seguro de que deseas devolver la unidad this.vehicleData.numero} - ${this.vehicleData.placa} al conductor ${this.driverData.codigo} - ${this.driverData.nombre} y retomar la unidad original $${this.originalVehicleData.numero} - ${this.originalVehicleData.placa}?`,
      },
      width: dialogWidth,
    });

    dialogRef.afterClosed().subscribe((confirmation: boolean) => {
      if (confirmation) {
        this.isLoadingChange = true;
        this.returnVehicle();
      } else {
        this.openSnackbar('Operación cancelada.');
      }
    });
  }

  returnVehicle() {
    const company = this.getCompany();
    const vehicleLoan = this.vehicles.value;
    const vehicleOriginal = this.originalVehicleData.numero;
    const reason = this.infoVehicleLoan.get('reason')?.value;

    const valuesSave = {
      company_code: company,
      original_vehicle: vehicleOriginal,
      return_vehicle: vehicleLoan,
      reason: reason,
    };

    this.apiService
      .postData('operations/return-vehicle', valuesSave)
      .subscribe({
        next: (response) => {
          this.openSnackbar('Vehículo devuelto exitosamente.');
          this.closeDialog();
        },
        error: (error: HttpErrorResponse) => {
          this.isLoadingChange = false;
          this.openSnackbar(
            'Error al devolver el vehículo. Inténtalo de nuevo más tarde.'
          );
        },
      });
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
