import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VehicleRepairRoutingModule } from './vehicle-repair-routing.module';
import { TableVehicleRepairComponent } from './components/table-vehicle-repair/table-vehicle-repair.component';
import { MaterialModule } from '../../shared/material/material.module';
import { InfoVehicleRepairDialogComponent } from './components/dialogs/info-vehicle-repair-dialog/info-vehicle-repair-dialog.component';
import { AddVehicleRepairDialogComponent } from './components/dialogs/add-vehicle-repair-dialog/add-vehicle-repair-dialog.component';
import { TakePhotosRepairComponent } from './components/dialogs/take-photos-repair/take-photos-repair.component';
import { ImagePreviewRepairDialogComponent } from './components/dialogs/image-preview-repair-dialog/image-preview-repair-dialog.component';
import { FinishImagesRepairDialogComponent } from './components/dialogs/finish-images-repair-dialog/finish-images-repair-dialog.component';
import { VehiclesRepairInfoComponent } from './components/dialogs/vehicles-repair-info/vehicles-repair-info.component';
import { FinishRepairNoteDialogComponent } from './components/dialogs/finish-repair-note-dialog/finish-repair-note-dialog.component';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
  declarations: [
    TableVehicleRepairComponent,
    InfoVehicleRepairDialogComponent,
    AddVehicleRepairDialogComponent,
    TakePhotosRepairComponent,
    ImagePreviewRepairDialogComponent,
    FinishImagesRepairDialogComponent,
    VehiclesRepairInfoComponent,
    FinishRepairNoteDialogComponent,
  ],
  imports: [CommonModule, VehicleRepairRoutingModule, MaterialModule, SharedModule],
})
export class VehicleRepairModule {}
