import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InspectionsVehicleInfoComponent } from './inspections-vehicle-info.component';

describe('InspectionsVehicleInfoComponent', () => {
  let component: InspectionsVehicleInfoComponent;
  let fixture: ComponentFixture<InspectionsVehicleInfoComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [InspectionsVehicleInfoComponent]
    });
    fixture = TestBed.createComponent(InspectionsVehicleInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
