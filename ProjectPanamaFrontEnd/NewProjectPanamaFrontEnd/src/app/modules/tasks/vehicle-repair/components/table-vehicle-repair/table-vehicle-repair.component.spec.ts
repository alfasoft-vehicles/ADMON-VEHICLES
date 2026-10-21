import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TableVehicleRepairComponent } from './table-vehicle-repair.component';

describe('TableVehicleRepairComponent', () => {
  let component: TableVehicleRepairComponent;
  let fixture: ComponentFixture<TableVehicleRepairComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TableVehicleRepairComponent]
    });
    fixture = TestBed.createComponent(TableVehicleRepairComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
