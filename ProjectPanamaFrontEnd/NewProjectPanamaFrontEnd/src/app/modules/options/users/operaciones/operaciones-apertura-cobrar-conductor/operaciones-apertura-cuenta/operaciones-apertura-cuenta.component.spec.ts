import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OperacionesAperturaCuentaComponent } from './operaciones-apertura-cuenta.component';

describe('OperacionesAperturaCuentaComponent', () => {
  let component: OperacionesAperturaCuentaComponent;
  let fixture: ComponentFixture<OperacionesAperturaCuentaComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [OperacionesAperturaCuentaComponent]
    });
    fixture = TestBed.createComponent(OperacionesAperturaCuentaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
