import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DriversTableComponent } from './components/drivers-table/drivers-table.component';

const routes: Routes = [
  {
      path: '',
      component: DriversTableComponent
    }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DriversRoutingModule { }
