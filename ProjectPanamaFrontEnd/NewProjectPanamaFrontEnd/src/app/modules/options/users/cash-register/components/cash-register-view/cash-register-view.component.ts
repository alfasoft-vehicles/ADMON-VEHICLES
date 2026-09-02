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
import { AddSurchargesDialogComponent } from '../../dialogs/add-surcharges-dialog/add-surcharges-dialog.component';
import {
  PaySurchargesDialogComponent,
  PaySurchargesDialogResult,
  SurchargePayItem,
} from '../../dialogs/pay-surcharges-dialog/pay-surcharges-dialog.component';
import { ConfirmActionDialogComponent } from 'src/app/modules/shared/components/confirm-action-dialog/confirm-action-dialog.component';

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

  paymentMethod: string = '';
  rentPayment: number = 0;
  accidentsPayment: number = 0;
  surchargesPayment: number = 0;
  registrationPayment: number = 0;
  savingsPayment: number = 0;
  totalReceived: number = 0;

  baseMileage: number = 0;
  currentKm: number | null = 0;
  isKmInvalid: boolean = false;

  messages: string[] = [];
  surchargesItems: SurchargePayItem[] = [];

  isVerifying: boolean = false;
  isCreatingRentReceipt: boolean = false;
  isCollecting: boolean = false;
  isVerified: boolean = false;

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

        const km = detail?.mileage;
        this.baseMileage =
          km !== null && km !== undefined && !isNaN(km) && Number(km) >= 0
            ? Number(km)
            : 0;
        this.currentKm = this.baseMileage;
        this.isKmInvalid = false;

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
    this.paymentMethod = '';
    this.rentPayment = 0;
    this.accidentsPayment = 0;
    this.surchargesPayment = 0;
    this.registrationPayment = 0;
    this.savingsPayment = 0;
    this.surchargesItems = [];
    this.baseMileage = 0;
    this.currentKm = 0;
    this.isKmInvalid = false;
    this.isVerified = false;
    this.calculateTotal();

    if (triggerToOpen) {
      setTimeout(() => {
        triggerToOpen.openPanel();
      }, 0);
    }
  }

  getSelectedVehicleNumber(): string {
    const vehicle = this.searchForm.get('vehicle')?.value;
    if (vehicle && typeof vehicle === 'object') {
      return vehicle.unidad;
    }
    return this.detailInfo?.vehicle || '';
  }

  getSelectedDriverCode(): string {
    const driver = this.searchForm.get('driver')?.value;
    if (driver && typeof driver === 'object') {
      return driver.codigo_conductor;
    }
    return this.detailInfo?.driver_code || '';
  }

  get isFormDisabled(): boolean {
    return (
      !this.paymentMethod ||
      this.isKmInvalid ||
      this.isVerifying ||
      this.isCreatingRentReceipt ||
      this.isCollecting
    );
  }

  get disabledTooltip(): string {
    if (this.isVerifying) {
      return 'Verificando recaudo...';
    }
    if (this.isCollecting) {
      return 'Procesando recaudo...';
    }
    if (this.isCreatingRentReceipt) {
      return 'Creando cuentas de diario...';
    }
    if (!this.paymentMethod) {
      return 'Acción deshabilitada: Debe seleccionar una forma de pago';
    }
    if (this.isKmInvalid) {
      return `Acción deshabilitada por kilometraje incorrecto (no puede ser menor a ${this.baseMileage})`;
    }
    return '';
  }

  onPaymentMethodChange() {
    this.isVerified = false;
  }

  onKmChange(value: any) {
    this.isVerified = false;
    const numValue =
      value !== null && value !== undefined && value !== ''
        ? Number(value)
        : null;
    if (numValue === null || isNaN(numValue) || numValue < this.baseMileage) {
      this.isKmInvalid = true;
      this.openSnackbar(
        `El kilometraje no puede ser menor a ${this.baseMileage}`,
      );
    } else {
      this.isKmInvalid = false;
    }
  }

  validateKm(): boolean {
    const numValue =
      this.currentKm !== null &&
      this.currentKm !== undefined &&
      (this.currentKm as any) !== ''
        ? Number(this.currentKm)
        : null;
    if (numValue === null || isNaN(numValue) || numValue < this.baseMileage) {
      this.isKmInvalid = true;
      this.openSnackbar(
        `No se puede guardar: El kilometraje no puede ser menor a ${this.baseMileage}`,
      );
      return false;
    }
    this.isKmInvalid = false;
    return true;
  }

  validateForm(): boolean {
    if (!this.paymentMethod) {
      this.openSnackbar('Debe seleccionar una forma de pago');
      return false;
    }
    return this.validateKm();
  }

  getRevenuePayload() {
    const companyCode = this.getCompany();
    const vehicleNumber = this.getSelectedVehicleNumber();
    const driverNumber = this.getSelectedDriverCode();
    const userData = this.jwtService.getUserData();
    const userId = userData?.id ? String(userData.id) : '';

    const paidSurcharges = this.surchargesItems
      .filter((item) => (item.amountToPay || 0) > 0)
      .map((item) => ({
        id: String(item.code),
        value: String(item.amountToPay),
      }));

    return {
      company_code: String(companyCode),
      vehicle_number: String(vehicleNumber),
      driver_number: String(driverNumber),
      payment_method: String(this.paymentMethod),
      mileage: parseInt(String(this.currentKm || 0), 10),
      daily_rent: Number(this.rentPayment || 0),
      accidents: Number(this.accidentsPayment || 0),
      surcharges_list: paidSurcharges,
      registration: Number(this.registrationPayment || 0),
      savings: Number(this.savingsPayment || 0),
      user: userId,
    };
  }

  onAccept() {
    if (!this.validateForm() || this.isVerifying) {
      return;
    }

    const payload = this.getRevenuePayload();

    if (!payload.vehicle_number || !payload.driver_number) {
      this.openSnackbar('Debe seleccionar un vehículo y un conductor válidos.');
      return;
    }

    this.isVerifying = true;

    this.apiService.postData('wallet/verify-revenue', payload).subscribe({
      next: (res: {
        valid: boolean;
        comments: string[];
        valid_rent: boolean;
        comments_rent: string[];
      }) => {
        this.isVerifying = false;

        if (!res.valid) {
          this.isVerified = false;
          const errorMsg =
            res.comments && res.comments.length > 0
              ? res.comments.join(' ')
              : 'La información ingresada no es válida.';
          this.openSnackbar(errorMsg);
          return;
        }

        if (!res.valid_rent) {
          this.isVerified = false;
          const confirmMsg =
            res.comments_rent && res.comments_rent.length > 0
              ? res.comments_rent[0]
              : '¿Crear Cuentas de Diario al Conductor (Anticipo de Cuenta)?';
          this.openConfirmRentReceiptDialog(confirmMsg);
          return;
        }

        this.isVerified = true;
        this.openSnackbar(
          'Verificación exitosa. Puede proceder con el recaudo.',
        );
      },
      error: (err) => {
        this.isVerifying = false;
        this.isVerified = false;
        console.error('Error al verificar recaudo:', err);
        const errMsg =
          err?.error?.message ||
          'Error al verificar la información. Intente nuevamente.';
        this.openSnackbar(errMsg);
      },
    });
  }

  openConfirmRentReceiptDialog(message: string) {
    const dialogRef = this.dialog.open(ConfirmActionDialogComponent, {
      width: '450px',
      maxWidth: '90vw',
      data: {
        documentName: 'Crear Cuenta de Diario al Conductor',
        message: message,
      },
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.createRentReceipt();
      }
    });
  }

  createRentReceipt() {
    const companyCode = this.getCompany();
    const vehicleNumber = this.getSelectedVehicleNumber();
    const driverNumber = this.getSelectedDriverCode();
    const userData = this.jwtService.getUserData();
    const userId = userData?.id ? String(userData.id) : '';

    const payload = {
      company_code: String(companyCode),
      vehicle_number: String(vehicleNumber),
      driver_number: String(driverNumber),
      user: userId,
      amount: Number(this.rentPayment || 0),
    };

    this.isCreatingRentReceipt = true;

    this.apiService.postData('wallet/create-rent-receipt', payload).subscribe({
      next: (res) => {
        this.isCreatingRentReceipt = false;
        this.isVerified = false;
        this.refreshWalletInfo();
        this.openSnackbar(
          'Cuentas de diario creadas correctamente. Haga clic en Verificar nuevamente para validar el recaudo.',
        );
      },
      error: (err) => {
        this.isCreatingRentReceipt = false;
        console.error('Error al crear cuentas de diario:', err);
        const errMsg =
          err?.error?.message ||
          'Error al crear las cuentas de diario. Intente nuevamente.';
        this.openSnackbar(errMsg);
      },
    });
  }

  onCollect() {
    if (!this.validateForm() || this.isCollecting) {
      return;
    }

    const payload = this.getRevenuePayload();

    if (!payload.vehicle_number || !payload.driver_number) {
      this.openSnackbar('Debe seleccionar un vehículo y un conductor válidos.');
      return;
    }

    this.isCollecting = true;

    this.apiService.postData('wallet/collect-revenue', payload).subscribe({
      next: (res: {
        valid: boolean;
        comments: string[];
        valid_rent: boolean;
        comments_rent: string[];
        receipt_number?: string;
        total_collected?: number;
      }) => {
        this.isCollecting = false;

        if (!res.valid || !res.valid_rent) {
          const allComments = [
            ...(res.comments || []),
            ...(res.comments_rent || []),
          ];
          const errorMsg =
            allComments.length > 0
              ? allComments.join(' ')
              : 'No se pudo procesar el recaudo. Verifique los datos.';
          this.isVerified = false;
          this.openSnackbar(errorMsg);
          return;
        }

        const receiptNo = res.receipt_number || '';
        const total =
          res.total_collected !== undefined
            ? Number(res.total_collected).toFixed(2)
            : this.totalReceived.toFixed(2);

        this.openSnackbar(
          `Recaudo #${receiptNo} procesado exitosamente por $${total}.`,
        );

        // Resetear inputs de pago y estado de verificación
        this.paymentMethod = '';
        this.rentPayment = 0;
        this.accidentsPayment = 0;
        this.surchargesPayment = 0;
        this.registrationPayment = 0;
        this.savingsPayment = 0;
        this.surchargesItems = [];
        this.totalReceived = 0;
        this.isVerified = false;

        // Recargar toda la información de la unidad y conductor como si se acabara de seleccionar
        this.fetchWalletData(payload.vehicle_number, payload.driver_number);
      },
      error: (err) => {
        this.isCollecting = false;
        this.isVerified = false;
        console.error('Error al procesar recaudo:', err);
        const errMsg =
          err?.error?.message ||
          'Error al procesar el recaudo. Intente nuevamente.';
        this.openSnackbar(errMsg);
      },
    });
  }

  calculateTotal() {
    this.isVerified = false;
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

  openAddSurchargesDialog() {
    const companyCode = this.getCompany();
    const vehicleNumber = this.getSelectedVehicleNumber();
    const driverCode = this.getSelectedDriverCode();

    const dialogRef = this.dialog.open(AddSurchargesDialogComponent, {
      width: '450px',
      maxWidth: '90vw',
      data: {
        companyCode,
        vehicleNumber,
        driverNumber: driverCode,
      },
    });

    dialogRef
      .afterClosed()
      .subscribe(
        (result: { value: number; code: string; name: string } | null) => {
          if (result && result.value > 0) {
            // Actualizar fondos y deudas del componente padre consultando el backend
            this.refreshWalletInfo();

            // Si ya se tenían recargos cargados, sincronizar el nuevo saldo
            const existingItem = this.surchargesItems.find(
              (item) => String(item.code) === String(result.code),
            );
            if (existingItem) {
              existingItem.balance = (existingItem.balance || 0) + result.value;
            }

            this.openSnackbar(
              `Recargo de $${result.value.toFixed(2)} (${result.name}) añadido correctamente.`,
            );
          }
        },
      );
  }

  refreshWalletInfo() {
    const company = this.getCompany();
    const vehicleNumber = this.getSelectedVehicleNumber();
    const driverCode = this.getSelectedDriverCode();

    if (company && vehicleNumber && driverCode) {
      const walletObs = this.apiService.getData(
        `wallet/vehicle-wallet-info/${company}/${vehicleNumber}/${driverCode}`,
      );
      const receiptsObs = this.apiService.getData(
        `wallet/receipts/${company}/${vehicleNumber}/${driverCode}`,
      );
      const detailObs = this.apiService.getData(
        `wallet/vehicle-driver-info/${company}/${vehicleNumber}`,
      );

      forkJoin([walletObs, receiptsObs, detailObs]).subscribe({
        next: ([wallet, receipts, detail]) => {
          this.walletInfo = wallet;
          this.receiptsInfo = receipts;
          if (this.detailInfo && detail) {
            this.detailInfo.accounts = detail.accounts;
          }
        },
        error: (err) => {
          console.error('Error al actualizar fondos, deudas y recibos:', err);
        },
      });
    }
  }

  openPaySurchargesDialog() {
    const companyCode = this.getCompany();
    const vehicleNumber = this.getSelectedVehicleNumber();
    const driverCode = this.getSelectedDriverCode();

    const dialogRef = this.dialog.open(PaySurchargesDialogComponent, {
      width: '650px',
      maxWidth: '95vw',
      data: {
        companyCode,
        vehicleNumber,
        driverNumber: driverCode,
        currentSurchargesPayment: this.surchargesPayment,
        savedItems: this.surchargesItems,
      },
    });

    dialogRef
      .afterClosed()
      .subscribe((result: PaySurchargesDialogResult | null) => {
        if (result && result.totalPayment !== undefined) {
          this.surchargesPayment = result.totalPayment;
          this.surchargesItems = result.allItems || result.items || [];
          this.calculateTotal();
          if (result.totalPayment > 0) {
            this.openSnackbar(
              `Recargos aplicados al recaudo: $${result.totalPayment.toFixed(2)}`,
            );
          } else {
            this.openSnackbar('Monto de recargos establecido en $0.00');
          }
        }
      });
  }
}
