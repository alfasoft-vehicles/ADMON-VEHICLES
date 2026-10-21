import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VehiclesDirectoryDialogComponent } from './vehicles-directory-dialog.component';

describe('VehiclesDirectoryDialogComponent', () => {
  let component: VehiclesDirectoryDialogComponent;
  let fixture: ComponentFixture<VehiclesDirectoryDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [VehiclesDirectoryDialogComponent]
    });
    fixture = TestBed.createComponent(VehiclesDirectoryDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
