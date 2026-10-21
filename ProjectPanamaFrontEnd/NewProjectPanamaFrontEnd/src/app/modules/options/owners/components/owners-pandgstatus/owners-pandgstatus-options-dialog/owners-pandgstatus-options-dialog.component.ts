import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ApiService } from 'src/app/services/api.service';
import { JwtService } from 'src/app/services/jwt.service';

@Component({
  selector: 'app-owners-pandgstatus-options-dialog',
  templateUrl: './owners-pandgstatus-options-dialog.component.html',
  styleUrls: ['./owners-pandgstatus-options-dialog.component.css'],
})
export class OwnersPandgstatusOptionsDialogComponent {

  constructor(
    private dialogRef: MatDialogRef<OwnersPandgstatusOptionsDialogComponent>,
  ) {}

  unitsPdf() {
    this.dialogRef.close('units');
  }

  generalPdf() {
    this.dialogRef.close('general');
  }
}
