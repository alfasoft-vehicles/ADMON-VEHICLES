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
import { OperacionesLiquidacionCuentaComponent } from './operaciones-liquidacion-cuenta/operaciones-liquidacion-cuenta.component';

interface vehicle {
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

interface LiquidationData {
  registration: number;
  daily_rent: number;
  accidents: number;
  other_debts: number;
  panapass: number;
  total_debt: number;
  owed_to_driver: number;
  owed_by_driver: number;
  other_expenses: number;
}

interface OtherExpensesItem {
  code: string;
  name: string;
  explanation: string;
  value: number;
}

interface dialogResult {
  accepted: boolean;
  data: LiquidationData;
  otherExpensesItems: OtherExpensesItem[];
}

@Component({
  selector: 'app-operaciones-bajar-conductor-vehiculo',
  templateUrl: './operaciones-bajar-conductor-vehiculo.component.html',
  styleUrls: ['./operaciones-bajar-conductor-vehiculo.component.css'],
})
export class OperacionesBajarConductorVehiculoComponent implements OnInit {
  vehicles = new FormControl('');
  drivers = new FormControl({ value: '', disabled: true });
  description = new FormControl({ value: '', disabled: true });
  reason = new FormControl('', [Validators.required]);
  options: vehicle[] = [];
  filteredOptions!: Observable<vehicle[]>;

  isLoadingVehicles: boolean = true;
  isLoadingVehicleInfo: boolean = false;
  selectedVehicle: boolean = false;
  isLoadingCreate: boolean = false;

  savedLiquidationData: LiquidationData | null = null;
  savedOtherExpensesItems: OtherExpensesItem[] = [];
  hasAcceptedLiquidation: boolean = false;

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
    private jwtService: JwtService,
    private apiService: ApiService,
    private snackBar: MatSnackBar,
    private dialogRef: MatDialogRef<OperacionesBajarConductorVehiculoComponent>,
    private dialog: MatDialog,
    private breakpointObserver: BreakpointObserver,
  ) {}

  ngOnInit() {
    this.getVehicles();
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
    this.apiService.getData('vehicles-by-state/' + company + '/1').subscribe(
      (response: vehicle[]) => {
        this.options = response;
        this.filteredOptions = this.vehicles.valueChanges.pipe(
          startWith(''),
          map((value) => this._filter(value || '')),
        );
        this.isLoadingVehicles = false;
      },
      (error) => {
        this.openSnackbar(
          'Error al obtener las unidades. Inténtalo de nuevo más tarde.',
        );
        this.closeDialog();
      },
    );
  }

  private _filter(value: string): vehicle[] {
    const filterValue = value.toLowerCase();

    return this.options.filter(
      (option) =>
        option.vehicle_plate.toLowerCase().includes(filterValue) ||
        option.vehicle_number.toLowerCase().includes(filterValue) ||
        option.owner.toLowerCase().includes(filterValue) ||
        option.quota_number.toLowerCase().includes(filterValue),
    );
  }

  vehicleSearch(vehicleValue: string) {
    this.resetInfo();
    this.selectedVehicle = false;
    if (vehicleValue !== '') {
      this.isLoadingVehicleInfo = true;
      this.apiService
        .getData(`operations/deliveryvehicledriver/vehicle/${vehicleValue}`)
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
                'Error al obtener la información del vehículo. Inténtalo de nuevo más tarde.',
              );
            }
          },
        });
    }
  }

  driverSearch(driverValue: string) {
    if (driverValue !== '') {
      this.apiService
        .getData(`operations/deliveryvehicledriver/driver/${driverValue}`)
        .subscribe({
          next: (data: driverInfo) => {
            this.isLoadingVehicleInfo = false;
            this.selectedVehicle = true;
            this.driverData = data;
          },
          error: (error: HttpErrorResponse) => {
            if (error.status === 404) {
              this.openSnackbar(
                'No se encontró el conductor para esta unidad.',
              );
            } else {
              this.openSnackbar(
                'Error al obtener la información del conductor. Inténtalo de nuevo más tarde.',
              );
            }
          },
        });
      return;
    }
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
    this.reason.setValue('');
    this.description.setValue('');
    this.drivers.setValue('');
    this.savedLiquidationData = null;
    this.savedOtherExpensesItems = [];
    this.hasAcceptedLiquidation = false;
  }

  resetAutocomplete() {
    this.vehicles.setValue('');
  }

  openSnackbar(message: string) {
    this.snackBar.open(message, 'Cerrar', {
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
  }

  openSettlementOfAccountDialog() {
    if (this.reason.value === '' || this.reason.value === null) {
      this.openSnackbar('Debes ingresar un motivo para continuar.');
      this.reason.markAsTouched();
      return;
    }

    const isSmallScreen = this.breakpointObserver.isMatched(Breakpoints.Small);
    const isXsmallScreen = this.breakpointObserver.isMatched(
      Breakpoints.XSmall,
    );
    const dialogWidth = isSmallScreen || isXsmallScreen ? '90vw' : '60%';

    const dialogRef = this.dialog.open(OperacionesLiquidacionCuentaComponent, {
      width: dialogWidth,
      data: {
        companyCode: this.getCompany(),
        vehicleNumber: this.vehicleData.numero,
        driverNumber: this.vehicleData.conductor,
        savedLiquidationData: this.savedLiquidationData,
        savedOtherExpensesItems: this.savedOtherExpensesItems,
      },
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((result: dialogResult) => {
      if (result) {
        this.savedLiquidationData = result.data;
        this.savedOtherExpensesItems = result.otherExpensesItems;
        this.hasAcceptedLiquidation = true;

        const detailText = this.formatOtherExpensesDescription(
          result.otherExpensesItems,
        );
        this.description.setValue(detailText);
        this.openSnackbar(
          'Para guardar la liquidación y bajar al conductor, debes confirmar.',
        );
      }
    });
  }

  formatOtherExpensesDescription(
    items: { code: string; name: string; explanation: string; value: number }[],
  ): string {
    if (!items || items.length === 0) {
      return '';
    }
    const modifiedItems = items.filter(
      (item) => item.value > 0 || item.explanation.trim() !== '',
    );
    if (modifiedItems.length === 0) {
      return '';
    }
    return modifiedItems
      .map((item) => `${item.name} ${item.explanation} ${item.value}`)
      .join(' // ');
  }

  confirm() {
    if (!this.hasAcceptedLiquidation) {
      this.openSnackbar(
        'Para continuar, primero debes aceptar la liquidación de cuenta.',
      );
      return;
    }

    const body = {
      company_code: this.getCompany(),
      vehicle_number: this.vehicleData.numero,
      driver_number: this.vehicleData.conductor,
    };

    const dialogRef = this.dialog.open(ConfirmActionDialogComponent, {
      width: '400px',
      data: {
        documentName: 'Confirmar Baja de Conductor',
        message:
          '¿Estás seguro de que deseas guardar la liquidación del vehículo y bajar el conductor ' +
          this.driverData.nombre +
          ' del vehículo ' +
          this.vehicleData.numero +
          ' (culminación de contrato)?',
      },
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((result: dialogResult) => {
      if (result) {
        this.isLoadingCreate = true;

        this.apiService
          .postData('operations/save-remove-driver', body)
          .subscribe({
            next: (response: any) => {
              this.openSnackbar('Conductor bajado exitosamente.');
              this.closeDialog();
            },
            error: (error: HttpErrorResponse) => {
              this.isLoadingCreate = false;
              this.openSnackbar(
                'Error al bajar el conductor. Inténtalo de nuevo más tarde.',
              );
            },
          });
      }
    });
  }

  closeDialog() {
    this.dialogRef.close();
  }
}
