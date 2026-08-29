import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface SurchargePayItem {
  code: string;
  name: string;
  balance: number;
  amountToPay: number | null;
}

export interface PaySurchargesDialogData {
  companyCode?: string;
  currentSurchargesPayment?: number;
  items?: SurchargePayItem[];
}

export interface PaySurchargesDialogResult {
  totalPayment: number;
  items: SurchargePayItem[];
}

@Component({
  selector: 'app-pay-surcharges-dialog',
  templateUrl: './pay-surcharges-dialog.component.html',
  styleUrls: ['./pay-surcharges-dialog.component.css'],
})
export class PaySurchargesDialogComponent implements OnInit {
  isLoading: boolean = false;
  filterTerm: string = '';

  // Lista de recargos mockeados basada en el sistema heredado
  surchargesList: SurchargePayItem[] = [
    { code: '121', name: 'Acuerdos De Pago', balance: 50.0, amountToPay: null },
    {
      code: '122',
      name: 'Exceso de Kilometraje',
      balance: 25.0,
      amountToPay: null,
    },
    {
      code: '123',
      name: 'Gastos Administrativos',
      balance: 15.0,
      amountToPay: null,
    },
    { code: '124', name: 'Mantenimiento', balance: 0.0, amountToPay: null },
    {
      code: '125',
      name: 'Multa Por Pagar Tarde',
      balance: 10.0,
      amountToPay: null,
    },
    {
      code: '126',
      name: 'Negativo Panapass',
      balance: 35.5,
      amountToPay: null,
    },
    {
      code: '127',
      name: 'Otras (Salida Interior-Cierre Semana)',
      balance: 0.0,
      amountToPay: null,
    },
    {
      code: '128',
      name: 'Recargos Financieros',
      balance: 0.0,
      amountToPay: null,
    },
  ];

  displayedColumns: string[] = ['code', 'name', 'balance', 'amountToPay'];

  constructor(
    public dialogRef: MatDialogRef<PaySurchargesDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PaySurchargesDialogData,
  ) {}

  ngOnInit(): void {
    if (this.data?.items && this.data.items.length > 0) {
      this.surchargesList = this.data.items.map((item) => ({ ...item }));
    }
  }

  get filteredSurcharges(): SurchargePayItem[] {
    if (!this.filterTerm || !this.filterTerm.trim()) {
      return this.surchargesList;
    }
    const term = this.filterTerm.toLowerCase().trim();
    return this.surchargesList.filter(
      (item) =>
        item.code.toLowerCase().includes(term) ||
        item.name.toLowerCase().includes(term),
    );
  }

  getTotalBalance(): number {
    return this.surchargesList.reduce(
      (acc, item) => acc + (item.balance || 0),
      0,
    );
  }

  getTotalToPay(): number {
    return this.surchargesList.reduce(
      (acc, item) => acc + (Number(item.amountToPay) || 0),
      0,
    );
  }

  getRemainingBalance(): number {
    const remaining = this.getTotalBalance() - this.getTotalToPay();
    return remaining > 0 ? remaining : 0;
  }

  payAllBalances(): void {
    this.surchargesList.forEach((item) => {
      if (item.balance > 0) {
        item.amountToPay = item.balance;
      } else {
        item.amountToPay = null;
      }
    });
  }

  clearAllAmounts(): void {
    this.surchargesList.forEach((item) => {
      item.amountToPay = null;
    });
  }

  paySingleItem(item: SurchargePayItem): void {
    if (item.balance > 0) {
      item.amountToPay = item.balance;
    }
  }

  onAmountInput(item: SurchargePayItem, event: any): void {
    if (item.balance <= 0) {
      item.amountToPay = null;
      return;
    }
    const rawVal = event?.target?.value;
    if (rawVal === '' || rawVal === null || rawVal === undefined) {
      item.amountToPay = null;
      return;
    }
    const num = Number(rawVal);
    if (isNaN(num) || num < 0) {
      item.amountToPay = 0;
    } else if (num > item.balance) {
      item.amountToPay = item.balance;
    } else {
      item.amountToPay = num;
    }
  }

  confirm(): void {
    const total = this.getTotalToPay();
    const paidItems = this.surchargesList.filter(
      (item) => (item.amountToPay || 0) > 0 && item.balance > 0,
    );

    const result: PaySurchargesDialogResult = {
      totalPayment: total,
      items: paidItems,
    };

    this.dialogRef.close(result);
  }

  cancel(): void {
    this.dialogRef.close(null);
  }
}
