import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

export interface QueryOption {
  id: string;
  label: string;
  icon: string;
  colorClass: string;
  bgClass: string;
}

@Component({
  selector: 'app-queries-dialog',
  templateUrl: './queries-dialog.component.html',
  styleUrls: ['./queries-dialog.component.css'],
})
export class QueriesDialogComponent {
  filterTerm: string = '';

  queryOptions: QueryOption[] = [
    {
      id: 'comisiones',
      label: 'Inf. Comisiones',
      icon: 'request_quote',
      colorClass: 'text-green',
      bgClass: 'bg-green',
    },
    {
      id: 'recibo',
      label: 'Copia Recibo',
      icon: 'receipt_long',
      colorClass: 'text-gray',
      bgClass: 'bg-gray',
    },
    {
      id: 'ventas_contado',
      label: 'Ventas Contado',
      icon: 'point_of_sale',
      colorClass: 'text-blue',
      bgClass: 'bg-blue',
    },
    {
      id: 'consecutivo',
      label: 'Consecutivo',
      icon: 'format_list_numbered',
      colorClass: 'text-orange',
      bgClass: 'bg-orange',
    },
    {
      id: 'detalle_general',
      label: 'Detalle General',
      icon: 'list_alt',
      colorClass: 'text-indigo',
      bgClass: 'bg-indigo',
    },
    {
      id: 'resumen_empresa',
      label: 'Resumen Emp.',
      icon: 'business',
      colorClass: 'text-purple',
      bgClass: 'bg-purple',
    },
    {
      id: 'resumen_cajero',
      label: 'Resumen Cajero',
      icon: 'person',
      colorClass: 'text-teal',
      bgClass: 'bg-teal',
    },
    {
      id: 'cajero_empresa',
      label: 'Cajero/Empresa',
      icon: 'group',
      colorClass: 'text-sky',
      bgClass: 'bg-sky',
    },
    {
      id: 'transferencias',
      label: 'Transferencias',
      icon: 'sync_alt',
      colorClass: 'text-cyan',
      bgClass: 'bg-cyan',
    },
    {
      id: 'resumen_diario',
      label: 'Resumen Diario',
      icon: 'calendar_today',
      colorClass: 'text-darkgray',
      bgClass: 'bg-darkgray',
    },
    {
      id: 'resumen_cierre',
      label: 'Resumen Cierre',
      icon: 'lock_clock',
      colorClass: 'text-red',
      bgClass: 'bg-red',
    },
  ];

  constructor(public dialogRef: MatDialogRef<QueriesDialogComponent>) {}

  get filteredOptions(): QueryOption[] {
    if (!this.filterTerm || !this.filterTerm.trim()) {
      return this.queryOptions;
    }
    const term = this.filterTerm.toLowerCase().trim();
    return this.queryOptions.filter((opt) =>
      opt.label.toLowerCase().includes(term),
    );
  }

  selectQuery(option: QueryOption): void {
    this.dialogRef.close(option);
  }

  close(): void {
    this.dialogRef.close(null);
  }
}
