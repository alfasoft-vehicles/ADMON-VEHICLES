import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InspectionsGenerateQrDialogComponent } from './inspections-generate-qr-dialog.component';

describe('InspectionsGenerateQrDialogComponent', () => {
  let component: InspectionsGenerateQrDialogComponent;
  let fixture: ComponentFixture<InspectionsGenerateQrDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [InspectionsGenerateQrDialogComponent]
    });
    fixture = TestBed.createComponent(InspectionsGenerateQrDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
