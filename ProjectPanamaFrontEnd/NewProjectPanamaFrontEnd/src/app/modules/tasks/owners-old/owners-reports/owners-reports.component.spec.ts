import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OwnersReportsComponent } from './owners-reports.component';

describe('OwnersReportsComponent', () => {
  let component: OwnersReportsComponent;
  let fixture: ComponentFixture<OwnersReportsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [OwnersReportsComponent]
    });
    fixture = TestBed.createComponent(OwnersReportsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
