import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { CashRegisterRoutingModule } from './cash-register-routing.module';
import { CashRegisterViewComponent } from './components/cash-register-view/cash-register-view.component';
import { MaterialModule } from 'src/app/modules/shared/material/material.module';
import { QueriesDialogComponent } from './dialogs/queries-dialog/queries-dialog.component';
import { PaySurchargesDialogComponent } from './dialogs/pay-surcharges-dialog/pay-surcharges-dialog.component';
import { AddSurchargesDialogComponent } from './dialogs/add-surcharges-dialog/add-surcharges-dialog.component';

@NgModule({
  declarations: [CashRegisterViewComponent, QueriesDialogComponent, PaySurchargesDialogComponent, AddSurchargesDialogComponent],
  imports: [
    CommonModule,
    CashRegisterRoutingModule,
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
  ],
})
export class CashRegisterModule {}
