import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VehicleStatesFormComponent } from './vehicle-states-form.component';

describe('VehicleStatesFormComponent', () => {
  let component: VehicleStatesFormComponent;
  let fixture: ComponentFixture<VehicleStatesFormComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [VehicleStatesFormComponent]
    });
    fixture = TestBed.createComponent(VehicleStatesFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
