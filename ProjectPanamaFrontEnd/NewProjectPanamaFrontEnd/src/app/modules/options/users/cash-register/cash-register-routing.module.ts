import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CashRegisterViewComponent } from './components/cash-register-view/cash-register-view.component';
import { BulkUploadViewComponent } from './components/bulk-upload-view/bulk-upload-view.component';
import { BulkUploadRecordsGuard } from 'src/app/guards/bulk-upload-records.guard';

const routes: Routes = [
  {
    path: '',
    component: CashRegisterViewComponent,
  },
  {
    path: 'bulk-upload',
    redirectTo: 'bulk-upload/yappy',
    pathMatch: 'full',
  },
  {
    path: 'bulk-upload/:type',
    component: BulkUploadViewComponent,
    canActivate: [BulkUploadRecordsGuard],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CashRegisterRoutingModule {}
