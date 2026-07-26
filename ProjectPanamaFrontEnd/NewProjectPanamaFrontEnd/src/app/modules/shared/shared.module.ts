import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { InfoCompanyComponent } from './components/info-company/info-company.component';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from './material/material.module';
import { ConfirmActionDialogComponent } from './components/confirm-action-dialog/confirm-action-dialog.component';
import { SignaturePadComponent } from './components/signature-pad/signature-pad.component';
import { CameraComponent } from './components/camera/camera/camera.component';
import { CameraPreviewComponent } from './components/camera/camera-preview/camera-preview.component';
import { FingerprintComponent } from './components/fingerprint/fingerprint.component';

@NgModule({
  declarations: [
    InfoCompanyComponent,
    ConfirmActionDialogComponent,
    SignaturePadComponent,
    CameraComponent,
    CameraPreviewComponent,
    FingerprintComponent,
  ],
  imports: [CommonModule, RouterModule, FormsModule, MaterialModule],
  exports: [
    InfoCompanyComponent,
    ConfirmActionDialogComponent,
    SignaturePadComponent,
    CameraComponent,
    FingerprintComponent,
  ],
})
export class SharedModule {}
