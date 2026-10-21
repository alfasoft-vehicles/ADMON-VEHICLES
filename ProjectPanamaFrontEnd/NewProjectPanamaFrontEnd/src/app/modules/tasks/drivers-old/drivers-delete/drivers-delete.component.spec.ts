import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DriversDeleteComponent } from './drivers-delete.component';

describe('DriversDeleteComponent', () => {
  let component: DriversDeleteComponent;
  let fixture: ComponentFixture<DriversDeleteComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DriversDeleteComponent]
    });
    fixture = TestBed.createComponent(DriversDeleteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
