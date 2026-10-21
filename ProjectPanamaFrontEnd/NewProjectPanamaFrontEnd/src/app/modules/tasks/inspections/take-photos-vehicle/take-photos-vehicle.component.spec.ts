import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TakePhotosVehicleComponent } from './take-photos-vehicle.component';

describe('TakePhotosVehicleComponent', () => {
  let component: TakePhotosVehicleComponent;
  let fixture: ComponentFixture<TakePhotosVehicleComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TakePhotosVehicleComponent]
    });
    fixture = TestBed.createComponent(TakePhotosVehicleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
