import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CashRegisterViewComponent } from './cash-register-view.component';

describe('CashRegisterViewComponent', () => {
  let component: CashRegisterViewComponent;
  let fixture: ComponentFixture<CashRegisterViewComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CashRegisterViewComponent]
    });
    fixture = TestBed.createComponent(CashRegisterViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
