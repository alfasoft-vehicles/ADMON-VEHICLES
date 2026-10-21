import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DriversResumeComponent } from './drivers-resume.component';

describe('DriversResumeComponent', () => {
  let component: DriversResumeComponent;
  let fixture: ComponentFixture<DriversResumeComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DriversResumeComponent]
    });
    fixture = TestBed.createComponent(DriversResumeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
