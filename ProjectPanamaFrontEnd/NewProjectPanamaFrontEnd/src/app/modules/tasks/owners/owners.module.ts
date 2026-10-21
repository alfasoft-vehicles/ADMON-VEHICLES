import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { OwnersRoutingModule } from './owners-routing.module';
import { OwnersTableComponent } from './components/owners-table/owners-table.component';
import { MaterialModule } from '../../shared/material/material.module';


@NgModule({
  declarations: [
    OwnersTableComponent
  ],
  imports: [
    CommonModule,
    OwnersRoutingModule,
    MaterialModule
  ]
})
export class OwnersModule { }
