import { Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import {
  LoadingDialogComponent,
  LoadingDialogData,
} from '../modules/shared/components/loading-dialog/loading-dialog.component';

@Injectable({
  providedIn: 'root',
})
export class LoadingService {
  private dialogRef: MatDialogRef<LoadingDialogComponent> | null = null;

  constructor(private dialog: MatDialog) {}

  /**
   * Abre el diálogo global de carga con mensaje y/o título configurable.
   */
  show(
    data?: LoadingDialogData | string,
  ): MatDialogRef<LoadingDialogComponent> {
    this.hide();

    const configData: LoadingDialogData =
      typeof data === 'string' ? { message: data } : data || {};

    this.dialogRef = this.dialog.open(LoadingDialogComponent, {
      data: configData,
      disableClose: true,
      panelClass: 'custom-loading-dialog-panel',
      autoFocus: false,
    });

    return this.dialogRef;
  }

  /**
   * Cierra el diálogo de carga actual si está abierto.
   */
  hide(): void {
    if (this.dialogRef) {
      this.dialogRef.close();
      this.dialogRef = null;
    }
  }
}
