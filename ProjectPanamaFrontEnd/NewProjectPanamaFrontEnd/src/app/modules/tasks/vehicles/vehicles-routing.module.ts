import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { VehiclesTableComponent } from './components/vehicles-table/vehicles-table.component';

const routes: Routes = [
  {
    path: '',
    component: VehiclesTableComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class VehiclesRoutingModule { }
