import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OperacionesLiquidacionCuentaComponent } from './operaciones-liquidacion-cuenta.component';

describe('OperacionesLiquidacionCuentaComponent', () => {
  let component: OperacionesLiquidacionCuentaComponent;
  let fixture: ComponentFixture<OperacionesLiquidacionCuentaComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [OperacionesLiquidacionCuentaComponent]
    });
    fixture = TestBed.createComponent(OperacionesLiquidacionCuentaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
