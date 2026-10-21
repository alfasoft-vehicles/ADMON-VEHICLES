import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { OwnersTableComponent } from './components/owners-table/owners-table.component';

const routes: Routes = [
  {
    path: '',
    component: OwnersTableComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class OwnersRoutingModule { }
