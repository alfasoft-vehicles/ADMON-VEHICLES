import { Component, OnInit, Inject } from '@angular/core';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { ApiService } from 'src/app/services/api.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpErrorResponse } from '@angular/common/http';
import { JwtService } from 'src/app/services/jwt.service';
import {
  OperacionesRelacionCuentasPagarComponent,
  OtherExpensesItem,
  OtherExpensesResult,
} from '../operaciones-relacion-cuentas-pagar/operaciones-relacion-cuentas-pagar.component';

export interface AccountOpeningDetail {
  registration: number;
  savings: number;
  total_funds: number;
  daily_rent: number;
  accidents: number;
  other_debts: number;
  total_debt: number;
  other_expenses?: number; // Para manejar la suma del otro diálogo
}

interface dialogData {
  companyCode: string;
  vehicleNumber: string;
  driverNumber: string;
  savedLiquidationData?: AccountOpeningDetail | null;
  savedOtherExpensesItems?: OtherExpensesItem[] | null;
}

@Component({
  selector: 'app-operaciones-apertura-cuenta',
  templateUrl: './operaciones-apertura-cuenta.component.html',
  styleUrls: ['./operaciones-apertura-cuenta.component.css'],
})
export class OperacionesAperturaCuentaComponent implements OnInit {
  isLoading: boolean = true;
  otherExpensesItems: OtherExpensesItem[] = [];
  otherExpensesTotal: number = 0;
  hasPrinted: boolean = false;

  data: AccountOpeningDetail = {
    registration: 0,
    savings: 0,
    total_funds: 0,
    daily_rent: 0,
    accidents: 0,
    other_debts: 0,
    total_debt: 0,
    other_expenses: 0,
  };

  constructor(
    public dialogRef: MatDialogRef<OperacionesAperturaCuentaComponent>,
    @Inject(MAT_DIALOG_DATA) public incomingData: dialogData,
    private dialog: MatDialog,
    private apiService: ApiService,
    private snackBar: MatSnackBar,
    private jwtService: JwtService,
  ) {}

  ngOnInit(): void {
    this.getAccountOpeningData();
  }

  getAccountOpeningData(): void {
    if (this.incomingData.savedLiquidationData) {
      this.data = { ...this.incomingData.savedLiquidationData };
      this.loadOtherExpensesItems();
      return;
    }

    this.isLoading = true;

    this.apiService
      .getData(
        `operations/info-account-opening/${this.incomingData.companyCode}/${this.incomingData.vehicleNumber}/${this.incomingData.driverNumber}`,
      )
      .subscribe({
        next: (data: AccountOpeningDetail) => {
          this.data = { ...data, other_expenses: 0 };
          this.loadOtherExpensesItems();
          this.isLoading = false;
        },
        error: (error: HttpErrorResponse) => {
          this.isLoading = false;
          this.openSnackbar('Error al obtener la información de la cuenta.');
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
      this.otherExpensesTotal = this.otherExpensesItems.reduce((acc, item) => acc + item.value, 0);
      this.isLoading = false;
    } else {
      this.getItemsCxP();
    }
  }

  getItemsCxP() {
    this.apiService
      .getData(`operations/items-cxp/${this.incomingData.companyCode}`)
      .subscribe({
        next: (data: any[]) => {
          this.otherExpensesItems = data.map(item => ({
            code: item.code,
            name: item.name,
            explanation: '',
            value: 0
          }));
        },
        error: (error: HttpErrorResponse) => {
          this.openSnackbar('Error al obtener los items de CXP.');
        },
      });
  }

  openOtherExpenses(): void {
    const dialogRef = this.dialog.open(
      OperacionesRelacionCuentasPagarComponent,
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
        this.otherExpensesTotal = result.totalOtherExpenses;
        this.data.other_expenses = result.totalOtherExpenses;
      }
    });
  }

  get totalApertura(): number {
    return this.data.total_debt + (this.data.other_expenses || 0) - this.data.total_funds;
  }

  accept(): void {
    if (!this.hasPrinted) {
      this.openSnackbar('Debes imprimir la apertura de cuenta primero para continuar.');
      return;
    }
    this.dialogRef.close({
      accepted: true,
      data: this.data,
      otherExpensesItems: this.otherExpensesItems,
    });
  }

  print(): void {
    const printData = {
      company_code: this.incomingData.companyCode,
      vehicle_number: this.incomingData.vehicleNumber,
      driver_number: this.incomingData.driverNumber,
      registration: this.data.registration,
      savings: this.data.savings,
      total_funds: this.data.total_funds,
      daily_rent: this.data.daily_rent,
      accidents: this.data.accidents,
      other_debts: this.data.other_debts,
      total_debt: this.data.total_debt,
      total_opening: this.totalApertura,
      details: this.formatOtherExpensesDescription(this.itemsModified),
      user: this.getUserId(),
    };

    const endpoint = 'operations/account-opening/pdf';

    localStorage.setItem('pdfEndpoint', endpoint);
    localStorage.setItem('pdfData', JSON.stringify(printData));

    window.open('/pdf', '_blank');
    this.hasPrinted = true;
  }

  get itemsModified(): OtherExpensesItem[] {
    return this.otherExpensesItems.filter(
      (item) => item.value > 0 || item.explanation.trim() !== '',
    );
  }

  close(): void {
    this.dialogRef.close();
  }

  private formatOtherExpensesDescription(items: OtherExpensesItem[]): string {
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
