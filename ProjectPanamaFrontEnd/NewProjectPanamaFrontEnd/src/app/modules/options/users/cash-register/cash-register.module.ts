import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CashRegisterRoutingModule } from './cash-register-routing.module';
import { CashRegisterViewComponent } from './components/cash-register-view/cash-register-view.component';


@NgModule({
  declarations: [
    CashRegisterViewComponent
  ],
  imports: [
    CommonModule,
    CashRegisterRoutingModule
  ]
})
export class CashRegisterModule { }
