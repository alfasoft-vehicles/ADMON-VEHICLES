import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { map, Observable, startWith } from 'rxjs';
import { ApiService } from 'src/app/services/api.service';
import { JwtService } from 'src/app/services/jwt.service';
import {
  AccountOpeningDetail,
  OperacionesAperturaCuentaComponent,
} from './operaciones-apertura-cuenta/operaciones-apertura-cuenta.component';
import { OtherExpensesItem } from '../operaciones-bajar-conductor-vehiculo/operaciones-otros-gastos/operaciones-liquidacion-otros-gastos/operaciones-liquidacion-otros-gastos.component';

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

@Component({
  selector: 'app-operaciones-apertura-cobrar-conductor',
  templateUrl: './operaciones-apertura-cobrar-conductor.component.html',
  styleUrls: ['./operaciones-apertura-cobrar-conductor.component.css'],
})
export class OperacionesAperturaCobrarConductorComponent implements OnInit {
  vehicles = new FormControl('');
  drivers = new FormControl({ value: '', disabled: true });
  description = new FormControl({ value: '', disabled: true });
  options: vehicle[] = [];
  filteredOptions!: Observable<vehicle[]>;

  isLoadingVehicles: boolean = true;
  isLoadingVehicleInfo: boolean = false;
  selectedVehicle: boolean = false;
  hasAcceptedApertura: boolean = false;
  isLoadingCreate: boolean = false;

  savedAperturaData: AccountOpeningDetail | null = null;
  savedOtherExpensesItems: OtherExpensesItem[] = [];

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
    con_cupo: 0,
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
    private dialogRef: MatDialogRef<OperacionesAperturaCobrarConductorComponent>,
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
    return userData ? userData.id : '';
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
        .getData(
          `operations/deliveryvehicledriver/vehicle/${this.getCompany()}/${vehicleValue}`,
        )
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
        .getData(
          `operations/deliveryvehicledriver/driver/${this.getCompany()}/${driverValue}`,
        )
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
      con_cupo: 0,
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
    this.description.setValue('');
    this.hasAcceptedApertura = false;
    this.savedAperturaData = null;
    this.savedOtherExpensesItems = [];
  }

  resetAutocomplete() {
    this.vehicles.setValue('');
  }

  openAperturaDeCuentaDialog() {
    const isSmallScreen = this.breakpointObserver.isMatched(Breakpoints.Small);
    const isXsmallScreen = this.breakpointObserver.isMatched(
      Breakpoints.XSmall,
    );
    const dialogWidth = isSmallScreen || isXsmallScreen ? '90vw' : '60%';

    const dialogRef = this.dialog.open(OperacionesAperturaCuentaComponent, {
      width: dialogWidth,
      data: {
        companyCode: this.getCompany(),
        vehicleNumber: this.vehicleData.numero,
        driverNumber: this.vehicleData.conductor,
        savedLiquidationData: this.savedAperturaData,
        savedOtherExpensesItems: this.savedOtherExpensesItems,
      },
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === 'printed') {
        this.closeDialog();
      }
    });
  }

  formatOtherExpensesDescription(items: OtherExpensesItem[]): string {
    if (!items || items.length === 0) return '';
    const modifiedItems = items.filter(
      (item) => item.value > 0 || item.explanation.trim() !== '',
    );
    return modifiedItems
      .map((item) => `${item.name} ${item.explanation} ${item.value}`)
      .join(' // ');
  }

  openSnackbar(message: string) {
    this.snackBar.open(message, 'Cerrar', {
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
  }

  closeDialog() {
    this.dialogRef.close();
  }
}
