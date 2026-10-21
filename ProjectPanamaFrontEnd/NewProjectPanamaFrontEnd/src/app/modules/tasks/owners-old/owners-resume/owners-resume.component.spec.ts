import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OwnersResumeComponent } from './owners-resume.component';

describe('OwnersResumeComponent', () => {
  let component: OwnersResumeComponent;
  let fixture: ComponentFixture<OwnersResumeComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [OwnersResumeComponent]
    });
    fixture = TestBed.createComponent(OwnersResumeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
