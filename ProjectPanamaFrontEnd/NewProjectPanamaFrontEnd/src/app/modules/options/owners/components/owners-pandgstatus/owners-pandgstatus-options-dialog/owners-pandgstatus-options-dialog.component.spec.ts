import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OwnersPandgstatusOptionsDialogComponent } from './owners-pandgstatus-options-dialog.component';

describe('OwnersPandgstatusOptionsDialogComponent', () => {
  let component: OwnersPandgstatusOptionsDialogComponent;
  let fixture: ComponentFixture<OwnersPandgstatusOptionsDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [OwnersPandgstatusOptionsDialogComponent]
    });
    fixture = TestBed.createComponent(OwnersPandgstatusOptionsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
