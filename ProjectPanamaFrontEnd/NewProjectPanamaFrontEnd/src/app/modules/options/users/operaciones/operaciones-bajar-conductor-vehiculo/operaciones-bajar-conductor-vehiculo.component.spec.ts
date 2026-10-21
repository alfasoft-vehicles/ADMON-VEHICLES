import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OperacionesBajarConductorVehiculoComponent } from './operaciones-bajar-conductor-vehiculo.component';

describe('OperacionesBajarConductorVehiculoComponent', () => {
  let component: OperacionesBajarConductorVehiculoComponent;
  let fixture: ComponentFixture<OperacionesBajarConductorVehiculoComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [OperacionesBajarConductorVehiculoComponent]
    });
    fixture = TestBed.createComponent(OperacionesBajarConductorVehiculoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
