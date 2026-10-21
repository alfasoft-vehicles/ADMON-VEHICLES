import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddSurchargesDialogComponent } from './add-surcharges-dialog.component';

describe('AddSurchargesDialogComponent', () => {
  let component: AddSurchargesDialogComponent;
  let fixture: ComponentFixture<AddSurchargesDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AddSurchargesDialogComponent]
    });
    fixture = TestBed.createComponent(AddSurchargesDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
