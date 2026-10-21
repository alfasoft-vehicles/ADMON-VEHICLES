import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CobrosRoutingModule } from './cobros-routing.module';
import { InfoTableComponent } from './components/info-table/info-table.component';
import { MaterialModule } from '../../../shared/material/material.module';
import { SharedModule } from '../../../shared/shared.module';

@NgModule({
  declarations: [
    InfoTableComponent
  ],
  imports: [
    CommonModule,
    CobrosRoutingModule,
    MaterialModule,
    SharedModule
  ]
})
export class CobrosModule { }
