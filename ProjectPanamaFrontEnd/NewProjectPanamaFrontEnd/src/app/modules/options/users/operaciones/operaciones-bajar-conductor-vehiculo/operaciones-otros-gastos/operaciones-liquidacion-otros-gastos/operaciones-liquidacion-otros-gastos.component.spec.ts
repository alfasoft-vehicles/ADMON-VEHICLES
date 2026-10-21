import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OperacionesLiquidacionOtrosGastosComponent } from './operaciones-liquidacion-otros-gastos.component';

describe('OperacionesLiquidacionOtrosGastosComponent', () => {
  let component: OperacionesLiquidacionOtrosGastosComponent;
  let fixture: ComponentFixture<OperacionesLiquidacionOtrosGastosComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [OperacionesLiquidacionOtrosGastosComponent]
    });
    fixture = TestBed.createComponent(OperacionesLiquidacionOtrosGastosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
