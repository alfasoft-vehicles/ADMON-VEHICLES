import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { InspectionFinishImagesDialogComponent } from './inspection-finish-images-dialog.component';

describe('InspectionFinishImagesDialogComponent', () => {
  let component: InspectionFinishImagesDialogComponent;
  let fixture: ComponentFixture<InspectionFinishImagesDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ InspectionFinishImagesDialogComponent ],
      providers: [
        { provide: MatDialogRef, useValue: {} },
        { provide: MAT_DIALOG_DATA, useValue: { vehicleNumber: 'TEST123', images: [] } }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InspectionFinishImagesDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
