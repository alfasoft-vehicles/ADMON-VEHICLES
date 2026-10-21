import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OperacionesExplicacionOtrosGastosComponent } from './operaciones-explicacion-otros-gastos.component';

describe('OperacionesExplicacionOtrosGastosComponent', () => {
  let component: OperacionesExplicacionOtrosGastosComponent;
  let fixture: ComponentFixture<OperacionesExplicacionOtrosGastosComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [OperacionesExplicacionOtrosGastosComponent]
    });
    fixture = TestBed.createComponent(OperacionesExplicacionOtrosGastosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
