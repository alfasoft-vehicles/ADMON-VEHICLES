import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PanapassDialogComponent } from './panapass-dialog.component';

describe('PanapassDialogComponent', () => {
  let component: PanapassDialogComponent;
  let fixture: ComponentFixture<PanapassDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PanapassDialogComponent]
    });
    fixture = TestBed.createComponent(PanapassDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
