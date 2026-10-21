import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VehiclesDeleteComponent } from './vehicles-delete.component';

describe('VehiclesDeleteComponent', () => {
  let component: VehiclesDeleteComponent;
  let fixture: ComponentFixture<VehiclesDeleteComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [VehiclesDeleteComponent]
    });
    fixture = TestBed.createComponent(VehiclesDeleteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
