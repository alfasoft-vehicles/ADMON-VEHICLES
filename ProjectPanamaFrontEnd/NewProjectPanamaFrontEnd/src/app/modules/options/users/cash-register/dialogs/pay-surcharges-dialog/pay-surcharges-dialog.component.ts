import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ApiService } from 'src/app/services/api.service';
import { JwtService } from 'src/app/services/jwt.service';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface SurchargePayItem {
  code: string;
  name: string;
  balance: number;
  amountToPay: number | null;
}

export interface PaySurchargesDialogData {
  companyCode?: string;
  vehicleNumber?: string;
  driverNumber?: string;
  currentSurchargesPayment?: number;
  savedItems?: SurchargePayItem[];
}

export interface PaySurchargesDialogResult {
  totalPayment: number;
  items: SurchargePayItem[];
  allItems?: SurchargePayItem[];
}

@Component({
  selector: 'app-pay-surcharges-dialog',
  templateUrl: './pay-surcharges-dialog.component.html',
  styleUrls: ['./pay-surcharges-dialog.component.css'],
})
export class PaySurchargesDialogComponent implements OnInit {
  isLoading: boolean = true;
  filterTerm: string = '';

  surchargesList: SurchargePayItem[] = [];

  displayedColumns: string[] = ['code', 'name', 'balance', 'amountToPay'];

  constructor(
    public dialogRef: MatDialogRef<PaySurchargesDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PaySurchargesDialogData,
    private apiService: ApiService,
    private jwtService: JwtService,
  ) {}

  ngOnInit(): void {
    this.fetchSurchargesData();
  }

  fetchSurchargesData(): void {
    this.isLoading = true;
    const userData = this.jwtService.getUserData();
    const company =
      this.data?.companyCode || (userData ? userData.empresa : '');
    const vehicleNumber = this.data?.vehicleNumber || '';
    const driverNumber = this.data?.driverNumber || '';

    // 1. Obtener catálogo de tipos de recargo
    const typesObs = this.apiService.getData(`surcharges/${company}`);

    // 2. Obtener saldos de recargos para esta unidad y conductor
    const balancesObs =
      company && vehicleNumber && driverNumber
        ? this.apiService.getData(
            `wallet/surcharges/${company}/${vehicleNumber}/${driverNumber}`,
          )
        : of([]);

    forkJoin({
      types: typesObs.pipe(
        catchError((err) => {
          console.error('Error al obtener tipos de recargo:', err);
          return of(this.getFallbackSurchargeTypes());
        }),
      ),
      balances: balancesObs.pipe(
        catchError((err) => {
          console.error('Error al obtener saldos de recargo:', err);
          return of([]);
        }),
      ),
    }).subscribe({
      next: ({ types, balances }: { types: any[]; balances: any[] }) => {
        const typesList: { code: string; name: string }[] =
          types && types.length > 0 ? types : this.getFallbackSurchargeTypes();
        const balancesList: {
          id?: string;
          code?: string;
          name?: string;
          balance: number;
        }[] = Array.isArray(balances) ? balances : [];

        // Mapear catálogo de tipos y hacer match con los saldos por ID/código
        this.surchargesList = typesList.map((type) => {
          const typeCode = String(type.code).trim();
          const balanceItem = balancesList.find(
            (b) => String(b.id || b.code || '').trim() === typeCode,
          );
          const rawBalance = balanceItem ? Number(balanceItem.balance) : 0;
          // Valores negativos se tratan como 0
          const cleanBalance =
            isNaN(rawBalance) || rawBalance < 0 ? 0 : rawBalance;

          // Restaurar monto previamente ingresado por el usuario si existe
          const savedItem = this.data?.savedItems?.find(
            (s) => String(s.code).trim() === typeCode,
          );
          let prevAmount: number | null = null;
          if (
            savedItem &&
            savedItem.amountToPay !== null &&
            savedItem.amountToPay > 0 &&
            cleanBalance > 0
          ) {
            prevAmount = Math.min(Number(savedItem.amountToPay), cleanBalance);
          }

          return {
            code: typeCode,
            name:
              type.name ||
              (balanceItem?.name ? balanceItem.name : `Recargo ${typeCode}`),
            balance: cleanBalance,
            amountToPay: prevAmount,
          };
        });

        // Incluir cualquier recargo presente en saldos pero no en catálogo de tipos
        balancesList.forEach((b) => {
          const bCode = String(b.id || b.code || '').trim();
          if (bCode && !this.surchargesList.some((s) => s.code === bCode)) {
            const rawBalance = Number(b.balance);
            const cleanBalance =
              isNaN(rawBalance) || rawBalance < 0 ? 0 : rawBalance;
            const savedItem = this.data?.savedItems?.find(
              (s) => String(s.code).trim() === bCode,
            );
            let prevAmount: number | null = null;
            if (
              savedItem &&
              savedItem.amountToPay !== null &&
              savedItem.amountToPay > 0 &&
              cleanBalance > 0
            ) {
              prevAmount = Math.min(
                Number(savedItem.amountToPay),
                cleanBalance,
              );
            }

            this.surchargesList.push({
              code: bCode,
              name: b.name || `Recargo ${bCode}`,
              balance: cleanBalance,
              amountToPay: prevAmount,
            });
          }
        });

        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error general al cargar recargos:', err);
        this.surchargesList = this.getFallbackSurchargesList();
        this.isLoading = false;
      },
    });
  }

  private getFallbackSurchargeTypes(): { code: string; name: string }[] {
    return [
      { code: '121', name: 'Acuerdos De Pago' },
      { code: '122', name: 'Exceso de Kilometraje' },
      { code: '123', name: 'Gastos Administrativos' },
      { code: '124', name: 'Mantenimiento' },
      { code: '125', name: 'Multa Por Pagar Tarde' },
      { code: '126', name: 'Negativo Panapass' },
      { code: '127', name: 'Otras (Salida Interior-Cierre Semana)' },
      { code: '128', name: 'Recargos Financieros' },
    ];
  }

  private getFallbackSurchargesList(): SurchargePayItem[] {
    return this.getFallbackSurchargeTypes().map((t) => {
      const savedItem = this.data?.savedItems?.find((s) => s.code === t.code);
      return {
        code: t.code,
        name: t.name,
        balance: 0,
        amountToPay: savedItem?.amountToPay ?? null,
      };
    });
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
      allItems: this.surchargesList,
    };

    this.dialogRef.close(result);
  }

  cancel(): void {
    this.dialogRef.close(null);
  }
}
