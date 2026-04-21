import { Component, Inject, OnInit } from '@angular/core';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { OperacionesExplicacionCuentasPagarComponent } from './operaciones-explicacion-cuentas-pagar/operaciones-explicacion-cuentas-pagar.component';

export interface OtherExpensesItem {
  code: string;
  name: string;
  explanation: string;
  value: number;
}

export interface OtherExpensesResult {
  items: OtherExpensesItem[];
  totalOtherExpenses: number;
}

@Component({
  selector: 'app-operaciones-relacion-cuentas-pagar',
  templateUrl: './operaciones-relacion-cuentas-pagar.component.html',
  styleUrls: ['./operaciones-relacion-cuentas-pagar.component.css'],
})
export class OperacionesRelacionCuentasPagarComponent implements OnInit {
  displayedColumns: string[] = ['code', 'name', 'explanation', 'value'];

  selectedItem: OtherExpensesItem | null = null;

  constructor(
    public dialogRef: MatDialogRef<OperacionesRelacionCuentasPagarComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: { otherExpensesItems: OtherExpensesItem[] },
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.preloadData();
  }

  preloadData(): void {
    if (
      this.data.otherExpensesItems &&
      this.data.otherExpensesItems.length > 0
    ) {
      this.data.otherExpensesItems.forEach((savedItem) => {
        const item = this.data.otherExpensesItems.find(
          (g) => g.code === savedItem.code
        );
        if (item) {
          item.explanation = savedItem.explanation;
          item.value = savedItem.value;
        }
      });
    }
  }

  openExplanation(item: OtherExpensesItem): void {
    this.selectedItem = item;

    const dialogRef = this.dialog.open(
      OperacionesExplicacionCuentasPagarComponent,
      {
        width: '450px',
        data: {
          code: item.code,
          name: item.name,
          explanation: item.explanation,
          value: item.value,
        },
      }
    );

    dialogRef
      .afterClosed()
      .subscribe(
        (result: { explanation: string; value: number } | undefined) => {
          if (result) {
            item.explanation = result.explanation;
            item.value = result.value;
          }
          this.selectedItem = null;
        }
      );
  }

  get totalOtherExpenses(): number {
    return this.data.otherExpensesItems.reduce(
      (sum, item) => sum + item.value,
      0
    );
  }

  save(): void {
    const result: OtherExpensesResult = {
      items: this.data.otherExpensesItems,
      totalOtherExpenses: this.totalOtherExpenses,
    };
    this.dialogRef.close(result);
  }

  close(): void {
    this.dialogRef.close(null);
  }
}
