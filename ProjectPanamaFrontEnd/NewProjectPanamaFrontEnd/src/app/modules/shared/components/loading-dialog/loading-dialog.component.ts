import { Component, Inject, Optional } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface LoadingDialogData {
  title?: string;
  message?: string;
  submessage?: string;
}

@Component({
  selector: 'app-loading-dialog',
  templateUrl: './loading-dialog.component.html',
  styleUrls: ['./loading-dialog.component.css'],
})
export class LoadingDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<LoadingDialogComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data?: LoadingDialogData,
  ) {}
}
