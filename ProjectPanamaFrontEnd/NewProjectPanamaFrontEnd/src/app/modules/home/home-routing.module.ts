import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeOwnersComponent } from './components/owners/home-owners/home-owners.component';
import { OwnersGuard } from 'src/app/guards/owners.guard';
import { HomeUsersComponent } from './components/users/home-users/home-users.component';
import { AuthGuard } from 'src/app/guards/auth.guard';
import { HomeRedirectGuard } from 'src/app/guards/home-redirect.guard';
import { UsersGuard } from 'src/app/guards/users.guard';

const routes: Routes = [
  {
    path: '',
    canActivate: [HomeRedirectGuard],
    children: [],
  },
  {
    path: 'owners',
    component: HomeOwnersComponent,
    canActivate: [OwnersGuard],
  },
  {
    path: 'users',
    component: HomeUsersComponent,
    canActivate: [AuthGuard, UsersGuard],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class HomeRoutingModule {}
