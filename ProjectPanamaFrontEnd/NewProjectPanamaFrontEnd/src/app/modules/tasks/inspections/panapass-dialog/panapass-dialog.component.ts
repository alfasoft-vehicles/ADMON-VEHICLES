import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-panapass-dialog',
  templateUrl: './panapass-dialog.component.html',
  styleUrls: ['./panapass-dialog.component.css'],
})
export class PanapassDialogComponent {
  constructor(
    private snackBar: MatSnackBar,
    private dialogRef: MatDialogRef<PanapassDialogComponent>
  ) {}

  openExternalLink(option: string) {
    if (option === 'placa') {
      window.open('https://ena.com.pa/consulta-de-placa/', '_blank');
      this.closeModal();
    } else if (option === 'usuario') {
      window.open('https://www.enarecargas.com/maxipista/private', '_blank');
      this.closeModal();
    } else {
      this.openSnackbar('Opción no válida.');
    }
  }

  openSnackbar(message: string) {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
  }

  closeModal() {
    this.dialogRef.close();
  }
}
