import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TableVehicleRepairComponent } from './components/table-vehicle-repair/table-vehicle-repair.component';

const routes: Routes = [
  {
    path: '',
    component: TableVehicleRepairComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class VehicleRepairRoutingModule { }
