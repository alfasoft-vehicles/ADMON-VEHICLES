import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OperacionesRelacionCuentasPagarComponent } from './operaciones-relacion-cuentas-pagar.component';

describe('OperacionesRelacionCuentasPagarComponent', () => {
  let component: OperacionesRelacionCuentasPagarComponent;
  let fixture: ComponentFixture<OperacionesRelacionCuentasPagarComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [OperacionesRelacionCuentasPagarComponent]
    });
    fixture = TestBed.createComponent(OperacionesRelacionCuentasPagarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
