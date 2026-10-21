import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DriversAddnewComponent } from './drivers-addnew.component';

describe('DriversAddnewComponent', () => {
  let component: DriversAddnewComponent;
  let fixture: ComponentFixture<DriversAddnewComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DriversAddnewComponent]
    });
    fixture = TestBed.createComponent(DriversAddnewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
