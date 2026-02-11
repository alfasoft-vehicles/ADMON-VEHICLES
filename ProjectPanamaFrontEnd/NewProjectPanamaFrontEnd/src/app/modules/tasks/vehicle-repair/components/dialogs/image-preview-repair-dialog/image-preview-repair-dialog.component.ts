import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { SafeUrl } from '@angular/platform-browser';

export interface DialogData {
  imageUrl: SafeUrl;
}

@Component({
  selector: 'app-image-preview-repair-dialog',
  templateUrl: './image-preview-repair-dialog.component.html',
  styleUrls: ['./image-preview-repair-dialog.component.css'],
})
export class ImagePreviewRepairDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ImagePreviewRepairDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
  ) {}
}
