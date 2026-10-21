import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { CashRegisterRoutingModule } from './cash-register-routing.module';
import { CashRegisterViewComponent } from './components/cash-register-view/cash-register-view.component';
import { MaterialModule } from 'src/app/modules/shared/material/material.module';
import { SharedModule } from 'src/app/modules/shared/shared.module';
import { QueriesDialogComponent } from './dialogs/queries-dialog/queries-dialog.component';
import { PaySurchargesDialogComponent } from './dialogs/pay-surcharges-dialog/pay-surcharges-dialog.component';
import { AddSurchargesDialogComponent } from './dialogs/add-surcharges-dialog/add-surcharges-dialog.component';
import { BulkUploadViewComponent } from './components/bulk-upload-view/bulk-upload-view.component';
import { SelectBankDialogComponent } from './components/bulk-upload-view/dialogs/select-bank-dialog/select-bank-dialog.component';
import { SearchUnitDialogComponent } from './components/bulk-upload-view/dialogs/search-unit-dialog/search-unit-dialog.component';

@NgModule({
  declarations: [
    CashRegisterViewComponent,
    QueriesDialogComponent,
    PaySurchargesDialogComponent,
    AddSurchargesDialogComponent,
    BulkUploadViewComponent,
    SelectBankDialogComponent,
    SearchUnitDialogComponent,
  ],
  imports: [
    CommonModule,
    CashRegisterRoutingModule,
    MaterialModule,
    SharedModule,
    FormsModule,
    ReactiveFormsModule,
  ],
})
export class CashRegisterModule {}
