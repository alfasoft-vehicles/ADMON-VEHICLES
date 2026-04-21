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
  selector: 'app-operaciones-cambiar-patio-vehiculo',
  templateUrl: './operaciones-cambiar-patio-vehiculo.component.html',
  styleUrls: ['./operaciones-cambiar-patio-vehiculo.component.css'],
})
export class OperacionesCambiarPatioVehiculoComponent {
  vehicles = new FormControl('');
  drivers = new FormControl({ value: '', disabled: true });
  options: vehicle[] = [];
  filteredOptions!: Observable<vehicle[]>;

  yards: objSelect[] = [];
  filteredYardsOptions!: Observable<objSelect[]>;

  isLoadingVehicles: boolean = true;
  isLoadingVehicleInfo: boolean = false;
  selectedVehicle: boolean = false;
  isLoadingChange: boolean = false;

  infoChangeYard!: FormGroup;

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
    private dialogRef: MatDialogRef<OperacionesCambiarPatioVehiculoComponent>,
    private dialog: MatDialog,
    private breakpointObserver: BreakpointObserver
  ) {}

  ngOnInit() {
    this.getVehicles();
    this.getYards();
    this.formBuild();
  }

  private yardValidator(group: FormGroup): null {
    const oldYardControl = group.controls['oldYard'];
    const newYardControl = group.controls['yard'];
  
    // Si los controles no existen, no hagas nada.
    if (!oldYardControl || !newYardControl) {
      return null;
    }
  
    const oldYard = oldYardControl.value;
    const newYard = newYardControl.value;
  
    if (oldYard?.id && newYard?.id && oldYard.id === newYard.id) {
      newYardControl.setErrors({ sameAsCurrent: true });
      return null;
    }
  
    if (!oldYard?.id && !newYard?.id) {
      newYardControl.setErrors({ required: true });
      return null;
    }
    
    newYardControl.setErrors(null);
    return null;
  }

  formBuild() {
    this.infoChangeYard = this.formBuilder.group({
      oldYard: [''],
      yard: [''],
      description: ['', Validators.required],
    }, { 
      validators: this.yardValidator 
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
            this.drivers.setValue(this.vehicleData.conductor);
            this.getVehicleYard();
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
            this.infoChangeYard.get('oldYard')?.setValue({
              id: response.id,
              name: response.name,
            });
          } else {
            this.openSnackbar(
              'No se encontró información de un patio para este vehículo.'
            );
          }
        },
        (error) => {
          this.openSnackbar(
            'Error al obtener la información del patio de este vehículo. Inténtalo de nuevo más tarde.'
          );
        }
      );
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
    this.drivers.setValue('');
    this.infoChangeYard.reset();
    this.infoChangeYard.get('yard')?.setValue('');
    this.infoChangeYard.get('oldYard')?.setValue('');
    this.infoChangeYard.get('description')?.setValue('');
  }

  resetAutocomplete(type: number) {
    if (type === 1) {
      this.vehicles.setValue('');
    } else if (type === 2) {
      this.infoChangeYard.get('yard')?.setValue('');
    }
  }

  getYards() {
    const company = this.getCompany();

    this.apiService.getData(`yards/${company}`).subscribe(
      (response: objSelect[]) => {
        this.yards = response;

        this.filteredYardsOptions = this.infoChangeYard
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

  displayAutocomplete(obj: objSelect): string {
    return obj && obj.name ? obj.name : '';
  }

  openConfirmationDialog() {
    if (this.infoChangeYard.invalid || !this.selectedVehicle) {
      this.openSnackbar('Por favor, completa todos los campos obligatorios.');
      this.infoChangeYard.markAllAsTouched();
      return;
    }

    const oldYard = this.infoChangeYard.get('oldYard')?.value;
    if (oldYard && oldYard.id === this.infoChangeYard.get('yard')?.value.id) {
      return;
    }

    if(oldYard){
      var message = `¿Estás seguro de que deseas cambiar el patio del vehículo ${
          this.vehicleData.numero
        } - ${this.vehicleData.placa} de ${
          this.infoChangeYard.get('oldYard')?.value.id
        } - ${this.infoChangeYard.get('oldYard')?.value.name} a ${
          this.infoChangeYard.get('yard')?.value.id
        } - ${this.infoChangeYard.get('yard')?.value.name}?`
    } else {
      var message = `¿Estás seguro de que deseas cambiar el patio del vehículo ${
          this.vehicleData.numero
        } - ${this.vehicleData.placa} a ${
          this.infoChangeYard.get('yard')?.value.id
        } - ${this.infoChangeYard.get('yard')?.value.name}?`
    }

    const isSmallScreen = this.breakpointObserver.isMatched(Breakpoints.Small);
    const isXsmallScreen = this.breakpointObserver.isMatched(
      Breakpoints.XSmall
    );
    const dialogWidth = isSmallScreen || isXsmallScreen ? '90vw' : '60%';

    const dialogRef = this.dialog.open(ConfirmActionDialogComponent, {
      data: {
        documentName: 'Cambiar de Patio a un Vehículo',
        message: message,
      },
      width: dialogWidth,
    });

    dialogRef.afterClosed().subscribe((confirmation: boolean) => {
      if (confirmation) {
        this.isLoadingChange = true;
        this.changeYardVehicle();
      } else {
        this.openSnackbar('Operación cancelada.');
      }
    });
  }

  changeYardVehicle() {
    const company = this.getCompany();

    const valuesSave = {
      company_code: company,
      vehicle_number: this.vehicleData.numero,
      yard_code: this.infoChangeYard.get('yard')?.value.id,
      description: this.infoChangeYard.get('description')?.value,
    }

    this.apiService
      .postData('operations/change-yard', valuesSave)
      .subscribe({
        next: (response) => {
          this.openSnackbar(
            'El patio del vehículo ha sido cambiado exitosamente.'
          );
          this.closeDialog();
        },
        error: (error: HttpErrorResponse) => {
          this.isLoadingChange = false;
          this.openSnackbar(
            'Error al cambiar el patio del vehículo. Inténtalo de nuevo más tarde.'
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
