import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VehiclesResumeComponent } from './vehicles-resume.component';

describe('VehiclesResumeComponent', () => {
  let component: VehiclesResumeComponent;
  let fixture: ComponentFixture<VehiclesResumeComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [VehiclesResumeComponent]
    });
    fixture = TestBed.createComponent(VehiclesResumeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
