import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CashRegisterViewComponent } from './components/cash-register-view/cash-register-view.component';
import { BulkUploadViewComponent } from './components/bulk-upload-view/bulk-upload-view.component';

const routes: Routes = [
  {
    path: '',
    component: CashRegisterViewComponent,
  },
  {
    path: 'bulk-upload',
    pathMatch: 'full',
    redirectTo: 'bulk-upload/yappy',
  },
  {
    path: 'bulk-upload/:type',
    component: BulkUploadViewComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CashRegisterRoutingModule {}
