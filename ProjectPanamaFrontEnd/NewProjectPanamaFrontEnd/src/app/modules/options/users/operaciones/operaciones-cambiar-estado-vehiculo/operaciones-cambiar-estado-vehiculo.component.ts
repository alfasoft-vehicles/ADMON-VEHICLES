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

@Component({
  selector: 'app-operaciones-cambiar-estado-vehiculo',
  templateUrl: './operaciones-cambiar-estado-vehiculo.component.html',
  styleUrls: ['./operaciones-cambiar-estado-vehiculo.component.css'],
})
export class OperacionesCambiarEstadoVehiculoComponent {
  vehicles = new FormControl('');
  drivers = new FormControl({ value: '', disabled: true });
  options: vehicle[] = [];
  filteredOptions!: Observable<vehicle[]>;

  yards: objSelect[] = [];
  filteredYardsOptions!: Observable<objSelect[]>;

  states: objSelect[] = [];
  filteredStatesOptions!: Observable<objSelect[]>;

  infoChangeState!: FormGroup;

  currentState: string = '';

  isLoadingVehicles: boolean = true;
  isLoadingVehicleInfo: boolean = false;
  selectedVehicle: boolean = false;
  isLoadingChange: boolean = false;

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
    private dialogRef: MatDialogRef<OperacionesCambiarEstadoVehiculoComponent>,
    private dialog: MatDialog,
    private breakpointObserver: BreakpointObserver
  ) {}

  ngOnInit() {
    this.getVehicles();
    this.getYards();
    this.getStates();
    this.formBuild();
  }

  formBuild() {
    this.infoChangeState = this.formBuilder.group({
      state: ['', Validators.required],
      yard: [''],
      description: ['', Validators.required],
    });
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
            this.setStateVehicle();
            this.getVehicleYard();
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

  setStateVehicle() {
    if (!this.vehicleData.estado || this.states.length === 0) {
      return;
    }
  
    const stateId = this.vehicleData.estado.split(' - ')[0].trim();
    this.currentState = stateId; 
  
    const selectedStateObject = this.states.find(state => state.id === stateId);

    if (selectedStateObject) {
      this.infoChangeState.patchValue({
        state: selectedStateObject
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

  getYards() {
    const company = this.getCompany();

    this.apiService.getData(`yards/${company}`).subscribe(
      (response: objSelect[]) => {
        this.yards = response;

        this.filteredYardsOptions = this.infoChangeState
          .get('yard')!
          .valueChanges.pipe(
            startWith(''),
            map((value) => {
              const name = typeof value === 'string' ? value : value?.name;
              return name ? this._filterYards(name) : this.yards.slice();
            })
          );
      },
      (error) => {
        this.openSnackbar(
          'Error al obtener los patios. Inténtalo de nuevo más tarde.'
        );
      }
    );
  }

  private _filterYards(value: string): objSelect[] {
    const filterValue = value.toLowerCase();

    return this.yards.filter(
      (option) =>
        option.id.toLowerCase().includes(filterValue) ||
        option.name.toLowerCase().includes(filterValue)
    );
  }

  getVehicleYard() {
    if (this.vehicleData.numero === '') {
      this.openSnackbar('Por favor, selecciona un vehículo primero.');
      return;
    }

    const company = this.getCompany();

    this.apiService
      .getData(`yards/vehicle/${company}/${this.vehicleData.numero}`)
      .subscribe(
        (response: any) => {
          if (response && response.id && response.name) {
            this.infoChangeState.get('yard')?.setValue({
              id: response.id,
              name: response.name,
            });
          }
        },
        (error) => {
          this.openSnackbar(
            'Error al obtener la información del patio de este vehículo. Inténtalo de nuevo más tarde.'
          );
        }
      );
  }

  getStates() {
    const company = this.getCompany();
    this.apiService.getData(`states/${company}`).subscribe(
      (response: objSelect[]) => {
        this.states = response.filter(
          (state) => state.id && state.id.trim() !== ''
        );
        this.filteredStatesOptions = this.infoChangeState
          .get('state')!
          .valueChanges.pipe(
            startWith(''),
            map((value) => {
              const name = typeof value === 'string' ? value : value?.name;
              return name ? this._filterStates(name) : this.states.slice();
            })
          );
      },
      (error) => {
        this.openSnackbar(
          'Error al obtener los estados de vehículos. Inténtalo de nuevo más tarde.'
        );
      }
    );
  }

  private _filterStates(value: string): objSelect[] {
    const filterValue = value.toLowerCase();

    return this.states.filter(
      (option) =>
        option.id.toLowerCase().includes(filterValue) ||
        option.name.toLowerCase().includes(filterValue)
    );
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
    this.infoChangeState.reset();
    this.drivers.setValue('');
    this.currentState = '';
  }

  resetAutocomplete(type: number) {
    if (type === 1) {
      this.vehicles.setValue('');
    } else if (type === 2) {
      this.infoChangeState.get('state')?.setValue('');
    } else if (type === 3) {
      this.infoChangeState.get('yard')?.setValue('');
    }
  }

  validateState(state: objSelect) {
    if (!state || !state.id) {
      this.infoChangeState.get('state')?.setErrors({ required: true });
      return;
    }

    const newStateId = state.id;
    if (newStateId === this.currentState) {
      this.infoChangeState.get('state')?.setErrors({ sameAsCurrent: true });
    } else {
      this.infoChangeState.get('state')?.setErrors(null);
    }
  }

  openConfirmationDialog() {
    if (this.infoChangeState.invalid || !this.selectedVehicle) {
      this.openSnackbar('Por favor, completa todos los campos obligatorios.');
      this.infoChangeState.markAllAsTouched();
      return;
    }
  
    const newStateId = this.infoChangeState.get('state')?.value.id;
  
    if (newStateId === this.currentState) {
      this.infoChangeState.get('state')?.setErrors({ sameAsCurrent: true });
      
      this.openSnackbar('El estado seleccionado es el mismo que el estado actual.');
      
      return;
    }

    const isSmallScreen = this.breakpointObserver.isMatched(Breakpoints.Small);
    const isXsmallScreen = this.breakpointObserver.isMatched(Breakpoints.XSmall);
    const dialogWidth = isSmallScreen || isXsmallScreen ? '90vw' : '60%';

    const dialogRef = this.dialog.open(ConfirmActionDialogComponent,
      {
        data: {
          documentName: 'Cambiar de Estado a un Vehículo',
          message: `¿Estás seguro de que deseas cambiar el estado del vehículo ${this.vehicleData.numero} - ${this.vehicleData.placa} de ${this.vehicleData.estado} a ${this.infoChangeState.get('state')?.value.id} - ${this.infoChangeState.get('state')?.value.name}?`,
        },
        width: dialogWidth,
      }
    );

    dialogRef.afterClosed().subscribe((confirmation: boolean) => {
      if (confirmation) {
        this.isLoadingChange = true;
        this.changeStateVehicle();
      } else {
        this.openSnackbar('Operación cancelada.');
      }
    });
  }

  changeStateVehicle() {
    const company = this.getCompany();
    const vehicle = this.vehicles.value;
  
    const valuesSave = {
      company_code: company,
      vehicle_number: vehicle,
      state_code: this.infoChangeState.get('state')?.value.id,
      yard_code: this.infoChangeState.get('yard')?.value?.id || '',
      change_reason: this.infoChangeState.get('description')?.value,
    };

    this.apiService
      .postData('operations/change-vehicle-state', valuesSave)
      .subscribe({
        next: (response) => {
          this.openSnackbar('Estado del vehículo cambiado exitosamente.');
          this.closeDialog();
        },
        error: (error: HttpErrorResponse) => {
          this.isLoadingChange = false;
          this.openSnackbar(
            'Error al cambiar el estado del vehículo. Inténtalo de nuevo más tarde.'
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
