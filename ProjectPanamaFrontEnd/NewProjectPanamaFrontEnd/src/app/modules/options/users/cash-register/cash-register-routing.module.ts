import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CashRegisterViewComponent } from './components/cash-register-view/cash-register-view.component';
import { BuYappyComponent } from './components/bulk-upload/bu-yappy/bu-yappy.component';

const routes: Routes = [
  {
    path: '',
    component: CashRegisterViewComponent,
  },
  {
    path: 'bulk-upload',
    component: BuYappyComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CashRegisterRoutingModule {}
