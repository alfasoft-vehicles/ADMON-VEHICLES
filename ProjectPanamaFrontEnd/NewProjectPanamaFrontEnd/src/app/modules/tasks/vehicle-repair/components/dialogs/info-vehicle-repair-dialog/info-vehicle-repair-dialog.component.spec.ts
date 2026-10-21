import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InfoVehicleRepairDialogComponent } from './info-vehicle-repair-dialog.component';

describe('InfoVehicleRepairDialogComponent', () => {
  let component: InfoVehicleRepairDialogComponent;
  let fixture: ComponentFixture<InfoVehicleRepairDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [InfoVehicleRepairDialogComponent]
    });
    fixture = TestBed.createComponent(InfoVehicleRepairDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
