import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TakeVehiclePhotoComponent } from './take-vehicle-photo.component';

describe('TakeVehiclePhotoComponent', () => {
  let component: TakeVehiclePhotoComponent;
  let fixture: ComponentFixture<TakeVehiclePhotoComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TakeVehiclePhotoComponent]
    });
    fixture = TestBed.createComponent(TakeVehiclePhotoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
