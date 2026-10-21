import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-owners-relationship-options',
  templateUrl: './owners-relationship-options.component.html',
  styleUrls: ['./owners-relationship-options.component.css'],
})
export class OwnersRelationshipOptionsComponent {
  constructor(
    private dialogRef: MatDialogRef<OwnersRelationshipOptionsComponent>
  ) {}

  unitsPdf() {
    this.dialogRef.close('units');
  }

  generalPdf() {
    this.dialogRef.close('general');
  }
}
