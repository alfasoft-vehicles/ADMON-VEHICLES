import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-owners-vehicles',
  templateUrl: './owners-vehicles.component.html',
  styleUrls: ['./owners-vehicles.component.css']
})
export class OwnersVehiclesComponent {
  @Input () vehicles: any;
}
