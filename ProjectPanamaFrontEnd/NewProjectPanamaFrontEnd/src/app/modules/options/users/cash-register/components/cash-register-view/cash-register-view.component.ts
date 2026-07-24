import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Observable, map, startWith, forkJoin } from 'rxjs';
import { ApiService } from 'src/app/services/api.service';
import { JwtService } from 'src/app/services/jwt.service';
import { MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { QueriesDialogComponent } from '../../dialogs/queries-dialog/queries-dialog.component';

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
  driver_photo?: string;
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

  @ViewChild('triggerDriver', { read: MatAutocompleteTrigger })
  triggerDriver!: MatAutocompleteTrigger;
  @ViewChild('triggerVehicle', { read: MatAutocompleteTrigger })
  triggerVehicle!: MatAutocompleteTrigger;

  allDrivers: drivers[] = [];
  allVehicles: vehicles[] = [];

  optionsDrivers!: Observable<drivers[]>;
  optionsVehicles!: Observable<vehicles[]>;

  walletInfo: WalletInfo | null = null;
  receiptsInfo: ReceiptsInfo | null = null;
  detailInfo: VehicleDriverDetail | null = null;
  isImageLoaded: boolean = false;

  closingDateInfo: { date: string; time: string } | null = null;
  notificationMessage: string | null = null;

  hasData: boolean = false;
  isLoading: boolean = false;
  isLoadingAutocompletes: boolean = true;

  paymentMethod: string = 'efectivo';
  rentPayment: number = 0;
  accidentsPayment: number = 0;
  surchargesPayment: number = 0;
  registrationPayment: number = 0;
  savingsPayment: number = 0;
  totalReceived: number = 0;

  messages: string[] = [];

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private jwtService: JwtService,
    private snackBar: MatSnackBar,
    private router: Router,
    private dialog: MatDialog,
  ) {}

  ngOnInit() {
    this.searchForm = this.fb.group({
      driver: [''],
      vehicle: [''],
    });

    this.getDataAutoCompletes();
    this.setupListeners();
  }

  getDataAutoCompletes() {
    this.isLoadingAutocompletes = true;
    const company = this.getCompany();

    const driversObs = this.apiService.getData('drivers_data/' + company);
    const vehiclesObs = this.apiService.getData('vehicles/' + company);
    const closingDateObs = this.apiService.getData(
      `wallet/closing-date/${company}`,
    );

    forkJoin([driversObs, vehiclesObs, closingDateObs]).subscribe({
      next: ([driversData, vehiclesData, closingDateData]: [
        drivers[],
        vehicles[],
        any,
      ]) => {
        this.allDrivers = driversData;
        this.optionsDrivers = this.searchForm.get('driver')!.valueChanges.pipe(
          startWith(''),
          map((value) => this._filterDrivers(value || '')),
        );

        this.allVehicles = vehiclesData;
        this.optionsVehicles = this.searchForm
          .get('vehicle')!
          .valueChanges.pipe(
            startWith(''),
            map((value) => this._filterVehicles(value || '')),
          );

        this.closingDateInfo = closingDateData;
        this.isLoadingAutocompletes = false;
      },
      error: (error) => {
        this.openSnackbar(
          'Error al cargar la información. Vuelve a intentarlo.',
        );
        this.isLoadingAutocompletes = false;
        this.router.navigate(['']);
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
    this.searchForm.get('driver')?.valueChanges.subscribe((value) => {
      if (typeof value === 'object' && value !== null) {
        const selectedDriver = value as drivers;
        const linkedVehicle = this.allVehicles.find(
          (v) => v.unidad === selectedDriver.numero_unidad,
        );
        if (linkedVehicle) {
          this.searchForm.patchValue(
            { vehicle: linkedVehicle },
            { emitEvent: false },
          );
          this.search();
        }
      } else if (typeof value === 'string') {
        if (this.hasData) {
          this.clearForm();
        } else {
          this.searchForm.patchValue({ vehicle: '' }, { emitEvent: false });
        }
      }
    });

    this.searchForm.get('vehicle')?.valueChanges.subscribe((value) => {
      if (typeof value === 'object' && value !== null) {
        const selectedVehicle = value as vehicles;
        const linkedDriver = this.allDrivers.find(
          (d) => d.numero_unidad === selectedVehicle.unidad,
        );
        if (linkedDriver) {
          this.searchForm.patchValue(
            { driver: linkedDriver },
            { emitEvent: false },
          );
          this.search();
        }
      } else if (typeof value === 'string') {
        if (this.hasData) {
          this.clearForm();
        } else {
          this.searchForm.patchValue({ driver: '' }, { emitEvent: false });
        }
      }
    });
  }

  search() {
    const driver = this.searchForm.get('driver')?.value;
    const vehicle = this.searchForm.get('vehicle')?.value;

    if (
      driver &&
      typeof driver === 'object' &&
      vehicle &&
      typeof vehicle === 'object'
    ) {
      this.fetchWalletData(vehicle.unidad, driver.codigo_conductor);
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
    const messagesObs = this.apiService.getData(
      `wallet/messages/${company}/${vehicleNumber}`,
    );
    const notificationsObs = this.apiService.getData(
      `wallet/notifications/${company}/${vehicleNumber}`,
    );

    forkJoin([
      walletObs,
      detailObs,
      receiptsObs,
      messagesObs,
      notificationsObs,
    ]).subscribe({
      next: ([wallet, detail, receipts, messages, notifications]: [
        any,
        any,
        any,
        any,
        any,
      ]) => {
        this.walletInfo = wallet;
        this.detailInfo = detail;
        this.isImageLoaded = false;
        this.receiptsInfo = receipts;
        this.messages = messages.messages || [];
        this.notificationMessage = notifications.maintenance_message;
        this.hasData = true;
        this.isLoading = false;

        this.calculateTotal();
      },
      error: (err) => {
        this.openSnackbar(
          'Error al cargar la información de la unidad. Intente de nuevo.',
        );
        this.isLoading = false;
        this.router.navigate(['']);
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

  clearForm(triggerToOpen?: MatAutocompleteTrigger) {
    this.hasData = false;
    this.walletInfo = null;
    this.receiptsInfo = null;
    this.detailInfo = null;
    this.isImageLoaded = false;
    this.messages = [];
    this.notificationMessage = null;

    this.searchForm.patchValue({
      driver: '',
      vehicle: '',
    });

    this.rentPayment = 0;
    this.accidentsPayment = 0;
    this.surchargesPayment = 0;
    this.registrationPayment = 0;
    this.savingsPayment = 0;
    this.calculateTotal();

    if (triggerToOpen) {
      setTimeout(() => {
        triggerToOpen.openPanel();
      }, 0);
    }
  }

  calculateTotal() {
    this.totalReceived =
      (this.rentPayment || 0) +
      (this.accidentsPayment || 0) +
      (this.surchargesPayment || 0) +
      (this.registrationPayment || 0) +
      (this.savingsPayment || 0);
  }

  openQueriesDialog() {
    this.dialog.open(QueriesDialogComponent, {
      width: '600px',
      maxWidth: '90vw',
    });
  }
}
