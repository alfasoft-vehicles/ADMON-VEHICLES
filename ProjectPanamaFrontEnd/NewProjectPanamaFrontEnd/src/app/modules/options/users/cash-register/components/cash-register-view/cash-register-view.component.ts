import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Observable, map, startWith, forkJoin } from 'rxjs';
import { ApiService } from 'src/app/services/api.service';
import { JwtService } from 'src/app/services/jwt.service';
import { MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { MatSnackBar } from '@angular/material/snack-bar';

export interface drivers {
  codigo_conductor: string;
  numero_unidad: string;
  nombre_conductor: string;
  cedula: string;
  codigo_propietario: string;
}

export interface vehicles {
  unidad: string;
  placa: string;
  propietario: string;
  nro_cupo: string;
}

export interface WalletInfo {
  funds: {
    registration: number;
    savings: number;
  };
  debts: {
    daily_rent: number;
    accidents: number;
    other_debts: number;
  };
}

export interface Receipt {
  date: string;
  type: string;
  invoice: string;
  amount: number;
}

export interface ReceiptsInfo {
  total_balance: number;
  receipts: Receipt[];
}

export interface VehicleDriverDetail {
  driver_code: string;
  driver_id_card: string;
  driver_name: string;
  driver_phone: string;
  start_date: string;
  driver_address: string;
  central: string;
  owner: string;
  license_plate: string;
  vehicle_state: string;
  accounts: {
    total_accounts: number;
    delivered_accounts: number;
    pending_accounts: number;
  };
  panapass_number: string;
  panapass_balance: string;
  mileage: number;
  vehicle: string;
  payment_form: string;
}

@Component({
  selector: 'app-cash-register-view',
  templateUrl: './cash-register-view.component.html',
  styleUrls: ['./cash-register-view.component.css'],
})
export class CashRegisterViewComponent implements OnInit {
  searchForm!: FormGroup;

  @ViewChild('triggerConductor', { read: MatAutocompleteTrigger })
  triggerConductor!: MatAutocompleteTrigger;
  @ViewChild('triggerVehiculo', { read: MatAutocompleteTrigger })
  triggerVehiculo!: MatAutocompleteTrigger;

  allDrivers: drivers[] = [];
  allVehicles: vehicles[] = [];

  optionsDrivers!: Observable<drivers[]>;
  optionsVehicles!: Observable<vehicles[]>;

  walletInfo: WalletInfo | null = null;
  receiptsInfo: ReceiptsInfo | null = null;
  detailInfo: VehicleDriverDetail | null = null;

  hasData: boolean = false;
  isLoading: boolean = false;
  isLoadingAutocompletes: boolean = true;

  formaPago: string = 'efectivo';
  pagoRenta: number = 0;
  pagoSiniestros: number = 0;
  pagoRecargos: number = 0;
  pagoInscripcion: number = 0;
  pagoAhorros: number = 0;
  totalRecibido: number = 0;

  mensajes: string[] = [
    'Conductor con revisión técnica pendiente para el próximo lunes.',
    'Alerta: Saldo en mora por siniestro desde hace más de 15 días.',
    'Recordatorio: El vehículo requiere rotación de neumáticos pronto.',
    'Documentación de seguro actualizada exitosamente hoy.',
    'Convenio de pago activo: restan 3 cuotas de $50.00.',
  ];

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private jwtService: JwtService,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit() {
    this.searchForm = this.fb.group({
      conductor: [''],
      vehiculo: [''],
    });

    this.getDataAutoCompletes();
    this.setupListeners();
  }

  getDataAutoCompletes() {
    this.isLoadingAutocompletes = true;
    const company = this.getCompany();

    const driversObs = this.apiService.getData('drivers_data/' + company);
    const vehiclesObs = this.apiService.getData('vehicles/' + company);

    forkJoin([driversObs, vehiclesObs]).subscribe({
      next: ([driversData, vehiclesData]: [drivers[], vehicles[]]) => {
        this.allDrivers = driversData;
        this.optionsDrivers = this.searchForm
          .get('conductor')!
          .valueChanges.pipe(
            startWith(''),
            map((value) => this._filterDrivers(value || '')),
          );

        this.allVehicles = vehiclesData;
        this.optionsVehicles = this.searchForm
          .get('vehiculo')!
          .valueChanges.pipe(
            startWith(''),
            map((value) => this._filterVehicles(value || '')),
          );

        this.isLoadingAutocompletes = false;
      },
      error: (error) => {
        this.openSnackbar(
          'Error al cargar conductores y vehículos. Intente de nuevo más tarde.',
        );
        this.isLoadingAutocompletes = false;
      },
    });
  }

  getCompany() {
    const userData = this.jwtService.getUserData();
    return userData ? userData.empresa : '';
  }

  private _filterDrivers(value: string | drivers): drivers[] {
    const filterValue =
      typeof value === 'string'
        ? value.toLowerCase()
        : value.nombre_conductor.toLowerCase();
    return this.allDrivers.filter(
      (option) =>
        option.nombre_conductor.toLowerCase().includes(filterValue) ||
        option.cedula.toLowerCase().includes(filterValue) ||
        option.codigo_conductor.toLowerCase().includes(filterValue),
    );
  }

  private _filterVehicles(value: string | vehicles): vehicles[] {
    const filterValue =
      typeof value === 'string'
        ? value.toLowerCase()
        : value.unidad.toLowerCase();
    return this.allVehicles.filter(
      (option) =>
        option.placa.toLowerCase().includes(filterValue) ||
        option.unidad.toLowerCase().includes(filterValue) ||
        option.propietario.toLowerCase().includes(filterValue) ||
        option.nro_cupo.toLowerCase().includes(filterValue),
    );
  }

  displayDriver(driver: any): string {
    if (driver && typeof driver === 'object') {
      return `${driver.cedula} - ${driver.nombre_conductor}`;
    }
    return driver || '';
  }

  displayVehicle(vehicle: any): string {
    if (vehicle && typeof vehicle === 'object') {
      return `${vehicle.unidad} - ${vehicle.placa} - ${vehicle.nro_cupo} - ${vehicle.propietario}`;
    }
    return vehicle || '';
  }

  setupListeners() {
    this.searchForm.get('conductor')?.valueChanges.subscribe((value) => {
      if (typeof value === 'object' && value !== null) {
        const selectedDriver = value as drivers;
        const linkedVehicle = this.allVehicles.find(
          (v) => v.unidad === selectedDriver.numero_unidad,
        );
        if (linkedVehicle) {
          this.searchForm.patchValue(
            { vehiculo: linkedVehicle },
            { emitEvent: false },
          );
          this.buscar();
        }
      } else if (typeof value === 'string') {
        if (this.hasData) {
          this.limpiar();
        } else {
          this.searchForm.patchValue({ vehiculo: '' }, { emitEvent: false });
        }
      }
    });

    this.searchForm.get('vehiculo')?.valueChanges.subscribe((value) => {
      if (typeof value === 'object' && value !== null) {
        const selectedVehicle = value as vehicles;
        const linkedDriver = this.allDrivers.find(
          (d) => d.numero_unidad === selectedVehicle.unidad,
        );
        if (linkedDriver) {
          this.searchForm.patchValue(
            { conductor: linkedDriver },
            { emitEvent: false },
          );
          this.buscar();
        }
      } else if (typeof value === 'string') {
        if (this.hasData) {
          this.limpiar();
        } else {
          this.searchForm.patchValue({ conductor: '' }, { emitEvent: false });
        }
      }
    });
  }

  buscar() {
    const conductor = this.searchForm.get('conductor')?.value;
    const vehiculo = this.searchForm.get('vehiculo')?.value;

    if (
      conductor &&
      typeof conductor === 'object' &&
      vehiculo &&
      typeof vehiculo === 'object'
    ) {
      this.fetchWalletData(vehiculo.unidad, conductor.codigo_conductor);
    }
  }

  fetchWalletData(vehicleNumber: string, driverCode: string) {
    this.isLoading = true;
    const company = this.getCompany();

    const walletObs = this.apiService.getData(
      `wallet/vehicle-wallet-info/${company}/${vehicleNumber}/${driverCode}`,
    );
    const detailObs = this.apiService.getData(
      `wallet/vehicle-driver-info/${company}/${vehicleNumber}`,
    );
    const receiptsObs = this.apiService.getData(
      `wallet/receipts/${company}/${vehicleNumber}/${driverCode}`,
    );

    forkJoin([walletObs, detailObs, receiptsObs]).subscribe({
      next: ([wallet, detail, receipts]) => {
        this.walletInfo = wallet;
        this.detailInfo = detail;
        this.receiptsInfo = receipts;
        this.hasData = true;
        this.isLoading = false;

        if (this.walletInfo && this.walletInfo.debts.daily_rent > 0) {
          this.pagoRenta = this.walletInfo.debts.daily_rent;
          this.calcularTotal();
        }
      },
      error: (err) => {
        this.openSnackbar(
          'Error al cargar la información de la unidad. Intente de nuevo.',
        );
        this.isLoading = false;
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

  limpiar(triggerToOpen?: MatAutocompleteTrigger) {
    this.hasData = false;
    this.walletInfo = null;
    this.receiptsInfo = null;
    this.detailInfo = null;

    this.searchForm.patchValue({
      conductor: '',
      vehiculo: '',
    });

    this.pagoRenta = 0;
    this.pagoSiniestros = 0;
    this.pagoRecargos = 0;
    this.pagoInscripcion = 0;
    this.pagoAhorros = 0;
    this.calcularTotal();

    if (triggerToOpen) {
      setTimeout(() => {
        triggerToOpen.openPanel();
      }, 0);
    }
  }

  calcularTotal() {
    this.totalRecibido =
      (this.pagoRenta || 0) +
      (this.pagoSiniestros || 0) +
      (this.pagoRecargos || 0) +
      (this.pagoInscripcion || 0) +
      (this.pagoAhorros || 0);
  }
}
