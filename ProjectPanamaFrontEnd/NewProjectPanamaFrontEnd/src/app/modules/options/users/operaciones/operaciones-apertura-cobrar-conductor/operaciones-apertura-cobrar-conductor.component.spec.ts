import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OperacionesAperturaCobrarConductorComponent } from './operaciones-apertura-cobrar-conductor.component';

describe('OperacionesAperturaCobrarConductorComponent', () => {
  let component: OperacionesAperturaCobrarConductorComponent;
  let fixture: ComponentFixture<OperacionesAperturaCobrarConductorComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [OperacionesAperturaCobrarConductorComponent]
    });
    fixture = TestBed.createComponent(OperacionesAperturaCobrarConductorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
