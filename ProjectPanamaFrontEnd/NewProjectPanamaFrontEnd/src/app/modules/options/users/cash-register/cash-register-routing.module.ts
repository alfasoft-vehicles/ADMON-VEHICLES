import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CashRegisterViewComponent } from './components/cash-register-view/cash-register-view.component';

const routes: Routes = [
  {
    path: '',
    component: CashRegisterViewComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CashRegisterRoutingModule { }
