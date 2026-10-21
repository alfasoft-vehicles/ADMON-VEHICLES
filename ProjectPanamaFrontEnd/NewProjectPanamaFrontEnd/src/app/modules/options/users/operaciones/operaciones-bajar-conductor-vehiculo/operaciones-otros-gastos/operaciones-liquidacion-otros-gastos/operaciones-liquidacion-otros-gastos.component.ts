import { Component, Inject, OnInit } from '@angular/core';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { OperacionesExplicacionOtrosGastosComponent } from '../operaciones-explicacion-otros-gastos/operaciones-explicacion-otros-gastos.component';

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
  selector: 'app-operaciones-liquidacion-otros-gastos',
  templateUrl: './operaciones-liquidacion-otros-gastos.component.html',
  styleUrls: ['./operaciones-liquidacion-otros-gastos.component.css'],
})
export class OperacionesLiquidacionOtrosGastosComponent implements OnInit {
  displayedColumns: string[] = ['code', 'name', 'explanation', 'value'];

  selectedItem: OtherExpensesItem | null = null;

  constructor(
    public dialogRef: MatDialogRef<OperacionesLiquidacionOtrosGastosComponent>,
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
      OperacionesExplicacionOtrosGastosComponent,
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
