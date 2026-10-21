import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OwnersVehiclesComponent } from './owners-vehicles.component';

describe('OwnersVehiclesComponent', () => {
  let component: OwnersVehiclesComponent;
  let fixture: ComponentFixture<OwnersVehiclesComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [OwnersVehiclesComponent]
    });
    fixture = TestBed.createComponent(OwnersVehiclesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
