import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-owners-statusfleet-options',
  templateUrl: './owners-statusfleet-options.component.html',
  styleUrls: ['./owners-statusfleet-options.component.css']
})
export class OwnersStatusfleetOptionsComponent {

  constructor(
    private dialogRef: MatDialogRef<OwnersStatusfleetOptionsComponent>,
  ) {}

  summaryPdf() {
    this.dialogRef.close('summary');
  }

  detailPdf() {
    this.dialogRef.close('detail');
  }
}
