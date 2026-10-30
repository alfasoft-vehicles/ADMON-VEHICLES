import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HomeRoutingModule } from './home-routing.module';
import { HomeOwnersComponent } from './components/owners/home-owners/home-owners.component';
import { HomeUsersComponent } from './components/users/home-users/home-users.component';
import { SharedModule } from '../shared/shared.module';
import { OwnersModule } from '../options/owners/owners.module';
import { CobrosComponent } from './components/users/options/cobros/cobros.component';
import { MaterialModule } from '../shared/material/material.module';
import { NavigationModule } from '../navigation/navigation.module';

@NgModule({
  declarations: [
    HomeOwnersComponent,
    HomeUsersComponent,
    CobrosComponent
  ],
  imports: [
    CommonModule,
    HomeRoutingModule,
    SharedModule,
    OwnersModule,
    MaterialModule,
    NavigationModule
  ]
})
export class HomeModule { }
