import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { CashRegisterRoutingModule } from './cash-register-routing.module';
import { CashRegisterViewComponent } from './components/cash-register-view/cash-register-view.component';
import { MaterialModule } from 'src/app/modules/shared/material/material.module';
import { QueriesDialogComponent } from './dialogs/queries-dialog/queries-dialog.component';

@NgModule({
  declarations: [CashRegisterViewComponent, QueriesDialogComponent],
  imports: [
    CommonModule,
    CashRegisterRoutingModule,
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
  ],
})
export class CashRegisterModule {}
