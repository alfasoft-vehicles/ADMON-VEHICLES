import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DriversTableComponent } from './drivers-table.component';

describe('DriversTableComponent', () => {
  let component: DriversTableComponent;
  let fixture: ComponentFixture<DriversTableComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DriversTableComponent]
    });
    fixture = TestBed.createComponent(DriversTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
