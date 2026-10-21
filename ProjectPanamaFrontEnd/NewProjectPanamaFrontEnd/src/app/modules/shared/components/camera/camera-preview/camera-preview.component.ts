import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { SafeUrl } from '@angular/platform-browser';

// Interfaz para los datos que recibirá el diálogo
export interface DialogData {
  imageUrl: SafeUrl;
}

@Component({
  selector: 'app-camera-preview',
  templateUrl: './camera-preview.component.html',
  styleUrls: ['./camera-preview.component.css']
})
export class CameraPreviewComponent {
  // Inyectamos MatDialogRef para controlar el diálogo y MAT_DIALOG_DATA para recibir datos
  constructor(
    public dialogRef: MatDialogRef<CameraPreviewComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {}
}
