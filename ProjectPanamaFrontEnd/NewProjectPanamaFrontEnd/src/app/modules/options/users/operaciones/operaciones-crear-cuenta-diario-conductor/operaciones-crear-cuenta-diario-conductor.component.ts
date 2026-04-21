import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
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

interface Validations {
  vehicle_state: boolean;
  vehicle_driver: boolean;
  vehicle_bill: boolean;
}

interface DateCurrently {
  time: string;
}

@Component({
  selector: 'app-operaciones-crear-cuenta-diario-conductor',
  templateUrl: './operaciones-crear-cuenta-diario-conductor.component.html',
  styleUrls: ['./operaciones-crear-cuenta-diario-conductor.component.css'],
})
export class OperacionesCrearCuentaDiarioConductorComponent implements OnInit {
  vehicles = new FormControl('');
  drivers = new FormControl({ value: '', disabled: true });
  selectedDate = new FormControl<Date | null>(null, {validators: [Validators.required]});
  description = new FormControl('', [Validators.maxLength(500)]);
  options: vehicle[] = [];
  filteredOptions!: Observable<vehicle[]>;

  isLoadingVehicles: boolean = true;
  isLoadingVehicleInfo: boolean = false;
  selectedVehicle: boolean = false;
  authorizedVehicle: boolean = false;
  checkedValidations: boolean = false;
  reCheckedValidations: boolean = false;
  isLoadingCreate: boolean = false;

  maxDate = new Date(); 
  date!: DateCurrently;

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

  validations: Validations = {
    vehicle_state: false,
    vehicle_driver: false,
    vehicle_bill: false,
  };

  constructor(
    private jwtService: JwtService,
    private apiService: ApiService,
    private snackBar: MatSnackBar,
    private dialogRef: MatDialogRef<OperacionesCrearCuentaDiarioConductorComponent>,
    private dialog: MatDialog,
    private breakpointObserver: BreakpointObserver
  ) {}

  ngOnInit() {
    this.getMaxDate();
    this.getVehicles();
  }

  getMaxDate() {
    this.apiService.getData('extras/time').subscribe(
      (response: any) => {
        this.date = response;
        const dateParts = response.time.split('-');
        this.maxDate = new Date(
          parseInt(dateParts[0]), 
          parseInt(dateParts[1]) - 1, 
          parseInt(dateParts[2])
        );
      },
      (error) => {
        this.maxDate = new Date();
      }
    );
  }

  getCompany() {
    const userData = this.jwtService.getUserData();
    return userData ? userData.empresa : '';
  }

  getUser() {
    const userData = this.jwtService.getUserData();
    return userData ? userData.nombre : '';
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
        option.nro_cupo.toLowerCase().includes(filterValue) ||
        option.propietario.toLowerCase().includes(filterValue)
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
            this.getValidations(this.date);
          },
          error: (error: HttpErrorResponse) => {
            if (error.status === 404) {
              this.getValidations(this.date);
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
    this.getValidations(this.date);
  }

  validationDateChange(event: any) {
    if (event.value) {
      this.reCheckedValidations = true;
      const selectedDate = new Date(event.value);
      this.getValidations({
        time: selectedDate.toISOString().split('T')[0],
      });
    } 
  }

  getValidations(date: DateCurrently) {
    if(this.vehicleData.numero !== '') {
      const company = this.getCompany();

      const validationsData = {
        company_code: company,
        vehicle_number: this.vehicleData.numero,
        bill_date: date.time,
      }
      this.apiService.postData('operations/validation', validationsData).subscribe({
        next: (response: Validations) => {
          this.validations = response;
          this.validateAuthorizedVehicle();
        },
        error: (error: HttpErrorResponse) => {
          this.openSnackbar(
            'Error al obtener las validaciones. Inténtalo de nuevo más tarde.'
          );
          this.isLoadingVehicleInfo = false;      
        }
      });
    }
  }

  validateAuthorizedVehicle(): void {
    this.isLoadingVehicleInfo = false;
    this.selectedVehicle = true;
    this.checkedValidations = true;
    this.reCheckedValidations = false;
    if(this.validations.vehicle_bill || !this.validations.vehicle_driver || !this.validations.vehicle_state) {
      this.openSnackbar('El vehículo no está autorizado para generar cuenta diaria.');
      this.authorizedVehicle = false;
      return;
    }
    this.authorizedVehicle = true;
    this.openSnackbar('El vehículo está autorizado para generar cuenta diaria.');
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
    this.validations = {
      vehicle_state: false,
      vehicle_driver: false,
      vehicle_bill: false,
    };
    this.authorizedVehicle = false;
    this.checkedValidations = false;
    this.selectedDate.setValue(this.maxDate);
    this.selectedDate.markAsUntouched(); 
    this.selectedDate.markAsPristine(); 
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

  openConfirmationDialog() {
    const isSmallScreen = this.breakpointObserver.isMatched(Breakpoints.Small);
    const isXsmallScreen = this.breakpointObserver.isMatched(Breakpoints.XSmall);
    const dialogWidth = isSmallScreen || isXsmallScreen ? '90vw' : '60%';

    const dialogRef = this.dialog.open(ConfirmActionDialogComponent,
      {
        data: {
          documentName: 'Crear Cuenta de Diario al Conductor',
          message: `¿Estás seguro de que deseas crear la cuenta diaria para el conductor ${this.driverData.nombre} con el vehículo ${this.vehicleData.numero} - ${this.vehicleData.placa}?`,
        },
        width: dialogWidth,
      }
    );

    dialogRef.afterClosed().subscribe((confirmation: boolean) => {
      if (confirmation) {
        this.isLoadingCreate = true;
        this.createDailyAccount();
      } else {
        this.openSnackbar('Operación cancelada.');
      }
    });
  }

  createDailyAccount() {
    const company = this.getCompany();
    const user = this.getUser();

    const accountData = {
      company_code: company,
      vehicle_number: this.vehicleData.numero,
      driver_number: this.driverData.codigo,
      bill_date: this.selectedDate.value?.toISOString().split('T')[0],
      description: this.description.value || '',
      user: user
    };

    this.apiService.postData('operations/new-bill', accountData).subscribe({
      next: (response) => {
        this.openSnackbar('Cuenta diaria creada exitosamente.');
        this.closeDialog();
      },
      error: (error: HttpErrorResponse) => {
        this.openSnackbar('Error al crear la cuenta diaria. Inténtalo de nuevo más tarde.');
        this.isLoadingCreate = false;
      }
    });
  }

  closeDialog() {
    this.dialogRef.close();
  }
}
