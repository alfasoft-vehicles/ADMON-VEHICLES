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

interface vehicle {
  unidad: string;
  placa: string;
  propietario: string;
  nro_cupo: string;
}

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
  estado: string;
}

interface objSelect {
  id: string;
  name: string;
}

interface validationsVehicleResponse {
  state: 0 | 1;
  driver: 0 | 1;
  loaned_unit: 0 | 1;
}

interface validationsVehicle {
  state: boolean;
  driver: boolean;
  loaned_unit: boolean;
}

@Component({
  selector: 'app-operaciones-prestamo-vehiculo-conductor',
  templateUrl: './operaciones-prestamo-vehiculo-conductor.component.html',
  styleUrls: ['./operaciones-prestamo-vehiculo-conductor.component.css'],
})
export class OperacionesPrestamoVehiculoConductorComponent {
  vehicles = new FormControl('');
  drivers = new FormControl({ value: '', disabled: true });
  options: vehicle[] = [];
  filteredOptions!: Observable<vehicle[]>;

  infoVehicleLoan!: FormGroup;
  optionsVehicleLoan: vehicleLoan[] = [];
  filteredOptionsVehicleLoan!: Observable<vehicleLoan[]>;

  isLoadingVehicles: boolean = true;
  isLoadingVehicleInfo: boolean = false;
  selectedVehicle: boolean = false;
  isLoadingChange: boolean = false;
  unauthorizedVehicle: boolean = false;
  isLoadingVehicleLoanInfo: boolean = false;
  selectedVehicleLoan: boolean = false;
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
    estado: '',
  };

  vehicleLoanData: vehicleInfo = {
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
    driver: false,
    loaned_unit: false,
  };

  constructor(
    private formBuilder: FormBuilder,
    private jwtService: JwtService,
    private apiService: ApiService,
    private snackBar: MatSnackBar,
    private dialogRef: MatDialogRef<OperacionesPrestamoVehiculoConductorComponent>,
    private dialog: MatDialog,
    private breakpointObserver: BreakpointObserver
  ) {}

  ngOnInit() {
    this.getVehicles();
    this.getVehiclesLoan();
    this.formBuild();
  }

  formBuild() {
    this.infoVehicleLoan = this.formBuilder.group({
      loanVehicle: ['', Validators.required],
      reason: ['', Validators.required],
    });
  }

  getCompany() {
    const userData = this.jwtService.getUserData();
    return userData ? userData.empresa : '';
  }

  getVehiclesLoan() {
    const company = this.getCompany();
    const state_code = '06';

    this.apiService.getData('vehicles-by-state/' + company + '/' + state_code).subscribe(
      (response: vehicleLoan[]) => {
        this.optionsVehicleLoan = response;
        this.filteredOptionsVehicleLoan = this.infoVehicleLoan
          .get('loanVehicle')!
          .valueChanges.pipe(
            startWith(''),
            map((value) => this._filterVehicleLoan(value || ''))
          );
      },
      (error) => {
        this.openSnackbar(
          'Error al obtener las unidades para préstamo. Inténtalo de nuevo más tarde.'
        );
        this.closeDialog();
      }
    );
  }

  private _filterVehicleLoan(value: string): vehicleLoan[] {
    const filterValue = value.toLowerCase();

    return this.optionsVehicleLoan.filter(
      (option) =>
        option.vehicle_plate.toLowerCase().includes(filterValue) ||
        option.vehicle_number.toLowerCase().includes(filterValue) ||
        option.owner.toLowerCase().includes(filterValue) ||
        option.quota_number.toLowerCase().includes(filterValue)
    );
  }

  vehicleLoanSearch(vehicleValue: string) {
    if(vehicleValue !== '') {
      this.selectedVehicleLoan = false;
      this.isLoadingVehicleLoanInfo = true;
      this.apiService
        .getData(`operations/deliveryvehicledriver/vehicle/${this.getCompany()}/${vehicleValue}`)
        .subscribe({
          next: (data: vehicleInfo) => {
            this.vehicleLoanData = data;
            this.isLoadingVehicleLoanInfo = false;
            this.selectedVehicleLoan = true;
          },
          error: (error: HttpErrorResponse) => {
            if (error.status === 404) {
              this.openSnackbar('Vehículo no encontrado. Intenta con otro.');
            } else {
              this.openSnackbar(
                'Error al obtener la información del vehículo. Inténtalo de nuevo más tarde.'
              );
            }
            this.isLoadingVehicleLoanInfo = false;
          },
        });
    }
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
    this.validationVehicle = true;
    if (vehicleValue !== '') {
      this.isLoadingVehicleInfo = true;
      this.apiService
        .getData(`operations/deliveryvehicledriver/vehicle/${this.getCompany()}/${vehicleValue}`)
        .subscribe({
          next: (data: vehicleInfo) => {
            this.vehicleData = data;
            this.validateVehicleData(data.numero);
            this.drivers.setValue(this.vehicleData.conductor);
            this.driverSearch(this.vehicleData.conductor);
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

  validateVehicleData(vehicle_number: string) {
    const company = this.getCompany();
  
    this.apiService
      .getData(`operations/loan-vehicle/validation/${company}/${vehicle_number}`)
      .subscribe({
        next: (data: validationsVehicleResponse) => {
          this.validationsVehicle = {
            state: data.state === 0,  
            driver: data.driver === 0,
            loaned_unit: data.loaned_unit === 1, 
          };
  
          if (this.validationsVehicle.state || this.validationsVehicle.driver || this.validationsVehicle.loaned_unit) {
            this.unauthorizedVehicle = true;
            this.validationVehicle = false;
  
            if (this.validationsVehicle.state) {
              this.openSnackbar(
                'El vehículo no cumple con las condiciones de estado para pedir un préstamo de otro.'
              );
            } else if (this.validationsVehicle.driver) {
              this.openSnackbar('El vehículo no tiene un conductor asociado.');
            } else if (this.validationsVehicle.loaned_unit) {
              this.openSnackbar(
                'El conductor ya tiene un vehículo prestado.'
              );
            }
          } else {
            this.unauthorizedVehicle = false;
            this.validationVehicle = false;
          }
        },
        error: () => {
          this.unauthorizedVehicle = true;
          this.validationVehicle = false;
          this.openSnackbar(
            'Error al validar el vehículo. Inténtalo de nuevo más tarde.'
          );
        }
      });
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
      estado: '',
    };
    this.infoVehicleLoan.reset();
    this.drivers.setValue('');
    this.selectedVehicleLoan = false;
    this.unauthorizedVehicle = false;
    this.validationsVehicle = {
      state: false,
      driver: false,
      loaned_unit: false,
    }
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
        documentName: 'Préstamo de Vehículo a Conductor',
        message: `¿Estás seguro de que deseas prestar la unidad ${this.vehicleLoanData.numero} - ${this.vehicleLoanData.placa} al conductor ${this.driverData.codigo} - ${this.driverData.nombre} con unidad original ${this.vehicleData.numero} - ${this.vehicleData.placa}?`,
      },
      width: dialogWidth,
    });

    dialogRef.afterClosed().subscribe((confirmation: boolean) => {
      if (confirmation) {
        this.isLoadingChange = true;
        this.lendVehicleDriver();
      } else {
        this.openSnackbar('Operación cancelada.');
      }
    });
  }

  lendVehicleDriver() {
    const company = this.getCompany();
    const vehicleOriginal = this.vehicles.value;
    const vehicleLoan = this.vehicleLoanData.numero;
    const reason = this.infoVehicleLoan.get('reason')?.value;

    const valuesSave = {
      company_code: company,
      original_vehicle: vehicleOriginal,
      loan_vehicle: vehicleLoan,
      reason: reason,
    };

    this.apiService
      .postData('operations/loan-vehicle', valuesSave)
      .subscribe({
        next: (response) => {
          this.openSnackbar('Vehículo prestado exitosamente.');
          this.closeDialog();
        },
        error: (error: HttpErrorResponse) => {
          this.isLoadingChange = false;
          this.openSnackbar(
            'Error al prestar el vehículo. Inténtalo de nuevo más tarde.'
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
