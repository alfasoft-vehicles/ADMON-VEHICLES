import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaySurchargesDialogComponent } from './pay-surcharges-dialog.component';

describe('PaySurchargesDialogComponent', () => {
  let component: PaySurchargesDialogComponent;
  let fixture: ComponentFixture<PaySurchargesDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PaySurchargesDialogComponent]
    });
    fixture = TestBed.createComponent(PaySurchargesDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
