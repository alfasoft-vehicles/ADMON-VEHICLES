import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { VehiclesRoutingModule } from './vehicles-routing.module';
import { MaterialModule } from 'src/app/modules/shared/material/material.module';
import { VehiclesTableComponent } from './components/vehicles-table/vehicles-table.component';
import { VehiclesDirectoryDialogComponent } from './components/dialogs/vehicles-directory-dialog/vehicles-directory-dialog.component';


@NgModule({
  declarations: [
    VehiclesTableComponent,
    VehiclesDirectoryDialogComponent
  ],
  imports: [
    CommonModule,
    VehiclesRoutingModule,
    MaterialModule
  ]
})
export class VehiclesModule { }
