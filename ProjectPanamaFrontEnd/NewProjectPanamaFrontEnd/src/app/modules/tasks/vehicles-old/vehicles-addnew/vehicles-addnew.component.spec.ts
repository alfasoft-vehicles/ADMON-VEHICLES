import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VehiclesAddnewComponent } from './vehicles-addnew.component';

describe('VehiclesAddnewComponent', () => {
  let component: VehiclesAddnewComponent;
  let fixture: ComponentFixture<VehiclesAddnewComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [VehiclesAddnewComponent]
    });
    fixture = TestBed.createComponent(VehiclesAddnewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
