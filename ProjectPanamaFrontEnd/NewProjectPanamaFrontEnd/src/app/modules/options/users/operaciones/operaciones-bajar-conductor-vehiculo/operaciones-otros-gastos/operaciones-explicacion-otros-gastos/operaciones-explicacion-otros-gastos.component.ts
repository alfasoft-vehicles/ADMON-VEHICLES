import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface ExplanationDialogData {
  code: string;
  name: string;
  explanation: string;
  value: number;
}

export interface ExplanationDialogResult {
  explanation: string;
  value: number;
}

@Component({
  selector: 'app-operaciones-explicacion-otros-gastos',
  templateUrl: './operaciones-explicacion-otros-gastos.component.html',
  styleUrls: ['./operaciones-explicacion-otros-gastos.component.css'],
})
export class OperacionesExplicacionOtrosGastosComponent implements OnInit {
  explanation: string = '';
  valueDisplay: string = '';
  value: number = 0;

  constructor(
    public dialogRef: MatDialogRef<OperacionesExplicacionOtrosGastosComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ExplanationDialogData
  ) {}

  ngOnInit(): void {
    this.explanation = this.data.explanation || '';
    this.value = this.data.value || 0;

    if (this.value > 0) {
      this.valueDisplay = this.formatNumber(this.value);
    }
  }

  formatNumber(num: number): string {
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  parseFormattedNumber(formatted: string): number {
    const cleaned = formatted.replace(/,/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  }

  onValueInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let inputValue = input.value;

    inputValue = inputValue.replace(/[^0-9.,]/g, '');

    this.value = this.parseFormattedNumber(inputValue);
    this.valueDisplay = inputValue;
  }

  onValueBlur(): void {
    if (this.value > 0) {
      this.valueDisplay = this.formatNumber(this.value);
    } else {
      this.valueDisplay = '';
    }
  }

  onValueFocus(): void {
    if (this.value === 0) {
      this.valueDisplay = '';
    }
  }

  accept(): void {
    const result: ExplanationDialogResult = {
      explanation: this.explanation.trim(),
      value: this.value,
    };
    this.dialogRef.close(result);
  }

  clearValue(): void {
    this.value = 0;
    this.valueDisplay = '';
  }

  cancel(): void {
    this.dialogRef.close(null);
  }
}
