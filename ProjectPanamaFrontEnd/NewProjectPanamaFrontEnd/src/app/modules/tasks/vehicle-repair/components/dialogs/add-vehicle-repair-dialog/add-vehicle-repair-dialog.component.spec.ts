import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddVehicleRepairDialogComponent } from './add-vehicle-repair-dialog.component';

describe('AddVehicleRepairDialogComponent', () => {
  let component: AddVehicleRepairDialogComponent;
  let fixture: ComponentFixture<AddVehicleRepairDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AddVehicleRepairDialogComponent]
    });
    fixture = TestBed.createComponent(AddVehicleRepairDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
