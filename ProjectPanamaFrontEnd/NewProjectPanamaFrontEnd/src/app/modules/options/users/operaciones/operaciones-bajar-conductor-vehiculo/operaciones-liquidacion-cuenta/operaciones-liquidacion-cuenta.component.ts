import { Component, OnInit, Inject } from '@angular/core';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import {
  OperacionesLiquidacionOtrosGastosComponent,
  OtherExpensesItem,
  OtherExpensesResult,
} from '../operaciones-otros-gastos/operaciones-liquidacion-otros-gastos/operaciones-liquidacion-otros-gastos.component';
import { ApiService } from 'src/app/services/api.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpErrorResponse } from '@angular/common/http';
import { JwtService } from 'src/app/services/jwt.service';

export interface LiquidationDetail {
  registration: number;
  daily_rent: number;
  accidents: number;
  other_debts: number;
  panapass: number;
  total_debt: number;
  other_expenses: number;
  owed_to_driver: number;
  owed_by_driver: number;
}

interface dialogData {
  companyCode: string;
  vehicleNumber: string;
  driverNumber: string;
  savedLiquidationData?: LiquidationDetail | null;
  savedOtherExpensesItems?: OtherExpensesItem[] | null;
}

@Component({
  selector: 'app-operaciones-liquidacion-cuenta',
  templateUrl: './operaciones-liquidacion-cuenta.component.html',
  styleUrls: ['./operaciones-liquidacion-cuenta.component.css'],
})
export class OperacionesLiquidacionCuentaComponent implements OnInit {
  isLoading: boolean = true;
  otherExpensesItems: OtherExpensesItem[] = [];
  hasPrinted: boolean = false;

  data: LiquidationDetail = {
    registration: 0,
    daily_rent: 0,
    other_debts: 0,
    panapass: 0,
    total_debt: 0,
    accidents: 0,
    other_expenses: 0,
    owed_to_driver: 0,
    owed_by_driver: 0,
  };

  constructor(
    public dialogRef: MatDialogRef<OperacionesLiquidacionCuentaComponent>,
    @Inject(MAT_DIALOG_DATA) public incomingData: dialogData,
    private dialog: MatDialog,
    private apiService: ApiService,
    private snackBar: MatSnackBar,
    private jwtService: JwtService,
  ) {}

  ngOnInit(): void {
    this.getLiquidationData();
  }

  getLiquidationData(): void {
    if (this.incomingData.savedLiquidationData) {
      this.data = { ...this.incomingData.savedLiquidationData };
      this.loadOtherExpensesItems();
      return;
    }

    this.isLoading = true;

    if (
      this.incomingData.companyCode === '' ||
      this.incomingData.vehicleNumber === '' ||
      this.incomingData.driverNumber === ''
    ) {
      this.isLoading = false;
      this.openSnackbar('Error al obtener la información de la liquidación.');
      return;
    }

    this.apiService
      .getData(
        `operations/remove-driver/${this.incomingData.companyCode}/${this.incomingData.vehicleNumber}/${this.incomingData.driverNumber}`,
      )
      .subscribe({
        next: (data: LiquidationDetail) => {
          this.data = data;
          this.loadOtherExpensesItems();
          this.isLoading = false;
        },
        error: (error: HttpErrorResponse) => {
          this.isLoading = false;
          this.openSnackbar(
            'Error al obtener la información de la liquidación.',
          );
          this.close();
        },
      });
  }

  loadOtherExpensesItems(): void {
    if (
      this.incomingData.savedOtherExpensesItems &&
      this.incomingData.savedOtherExpensesItems.length > 0
    ) {
      this.otherExpensesItems = [...this.incomingData.savedOtherExpensesItems];
      this.isLoading = false;
    } else {
      this.getItemsCxP();
    }
  }

  transformBackendExpenses(
    backendItems: { code: string; name: string }[],
  ): OtherExpensesItem[] {
    return backendItems.map((item) => ({
      code: item.code,
      name: item.name,
      explanation: '',
      value: 0,
    }));
  }

  getItemsCxP() {
    this.apiService
      .getData(`operations/items-cxp/${this.incomingData.companyCode}`)
      .subscribe({
        next: (data: OtherExpensesItem[]) => {
          this.otherExpensesItems = this.transformBackendExpenses(data);
        },
        error: (error: HttpErrorResponse) => {
          this.openSnackbar('Error al obtener los items de CXP.');
        },
      });
  }

  openOtherExpenses(): void {
    const dialogRef = this.dialog.open(
      OperacionesLiquidacionOtrosGastosComponent,
      {
        width: '850px',
        maxWidth: '95vw',
        maxHeight: '85vh',
        data: {
          otherExpensesItems: this.otherExpensesItems,
        },
      },
    );

    dialogRef.afterClosed().subscribe((result: OtherExpensesResult | null) => {
      if (result) {
        this.otherExpensesItems = result.items;
        this.data.other_expenses = result.totalOtherExpenses;
        this.recalculateAmounts();
      }
    });
  }

  private recalculateAmounts(): void {
    const totalFunds = this.data.registration;
    const totalDebts = this.data.total_debt + this.data.other_expenses;

    if (totalFunds >= totalDebts) {
      this.data.owed_to_driver = totalFunds - totalDebts;
      this.data.owed_by_driver = 0;
    } else {
      this.data.owed_to_driver = 0;
      this.data.owed_by_driver = totalDebts - totalFunds;
    }
  }

  print(): void {
    const data = {
      company_code: this.incomingData.companyCode,
      user: this.getUserId(),
      vehicle_number: this.incomingData.vehicleNumber,
      driver_number: this.incomingData.driverNumber,
      registration: this.data.registration,
      daily_rent: this.data.daily_rent,
      accidents: this.data.accidents,
      other_debts: this.data.other_debts,
      panapass: this.data.panapass,
      total_debt: this.data.total_debt,
      other_expenses: this.data.other_expenses,
      owed_to_driver: this.data.owed_to_driver,
      owed_by_driver: this.data.owed_by_driver,
      details: this.formatOtherExpensesDescription(this.itemsModified),
    };

    const endpoint = 'operations/driver-settlement';

    localStorage.setItem('pdfEndpoint', endpoint);
    localStorage.setItem('pdfData', JSON.stringify(data));

    window.open('/pdf', '_blank');
    this.hasPrinted = true;
  }

  get itemsModified(): OtherExpensesItem[] {
    return this.otherExpensesItems.filter(
      (item) => item.value > 0 || item.explanation.trim() !== '',
    );
  }

  accept(): void {
    if (!this.hasPrinted) {
      this.openSnackbar('Debes imprimir la liquidación de cuenta primero para continuar.');
      return;
    }
    this.dialogRef.close({
      accepted: true,
      data: this.data,
      otherExpensesItems: this.otherExpensesItems,
    });
  }

  close(): void {
    this.dialogRef.close();
  }

  private formatOtherExpensesDescription(
    items: { code: string; name: string; explanation: string; value: number }[],
  ): string {
    if (!items || items.length === 0) {
      return '';
    }
    return items
      .map((item) => `${item.name} ${item.explanation} ${item.value}`)
      .join(' // ');
  }

  private openSnackbar(message: string) {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
  }

  private getUserId(): string {
    const userData = this.jwtService.getUserData();
    return userData ? userData.id : '';
  }
}
