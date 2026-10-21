import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InspectionInfoDialogComponent } from './inspection-info-dialog.component';

describe('InspectionInfoDialogComponent', () => {
  let component: InspectionInfoDialogComponent;
  let fixture: ComponentFixture<InspectionInfoDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [InspectionInfoDialogComponent]
    });
    fixture = TestBed.createComponent(InspectionInfoDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
