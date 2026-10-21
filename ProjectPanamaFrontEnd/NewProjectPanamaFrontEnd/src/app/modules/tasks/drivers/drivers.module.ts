import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DriversRoutingModule } from './drivers-routing.module';
import { DriversTableComponent } from './components/drivers-table/drivers-table.component';
import { MaterialModule } from '../../shared/material/material.module';


@NgModule({
  declarations: [
    DriversTableComponent
  ],
  imports: [
    CommonModule,
    DriversRoutingModule,
    MaterialModule
  ]
})
export class DriversModule { }
