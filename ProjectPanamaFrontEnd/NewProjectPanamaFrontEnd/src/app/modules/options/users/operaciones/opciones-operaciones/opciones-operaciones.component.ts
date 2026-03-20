import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { OperacionesContratoDeclaracionJuradaComponent } from '../operaciones-contrato-declaracion-jurada/operaciones-contrato-declaracion-jurada.component';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { OperacionesCrearCuentaDiarioConductorComponent } from '../operaciones-crear-cuenta-diario-conductor/operaciones-crear-cuenta-diario-conductor.component';
import { OperacionesCambiarEstadoVehiculoComponent } from '../operaciones-cambiar-estado-vehiculo/operaciones-cambiar-estado-vehiculo.component';
import { OperacionesCambiarPatioVehiculoComponent } from '../operaciones-cambiar-patio-vehiculo/operaciones-cambiar-patio-vehiculo.component';
import { OperacionesCorregirKilometrajeActualComponent } from '../operaciones-corregir-kilometraje-actual/operaciones-corregir-kilometraje-actual.component';
import { OperacionesPrestamoVehiculoConductorComponent } from '../operaciones-prestamo-vehiculo-conductor/operaciones-prestamo-vehiculo-conductor.component';
import { OperacionesDevolucionVehiculoPrestadoComponent } from '../operaciones-devolucion-vehiculo-prestado/operaciones-devolucion-vehiculo-prestado.component';
import { OperacionesBajarConductorVehiculoComponent } from '../operaciones-bajar-conductor-vehiculo/operaciones-bajar-conductor-vehiculo.component';
import { OperacionesAperturaCobrarConductorComponent } from '../operaciones-apertura-cobrar-conductor/operaciones-apertura-cobrar-conductor.component';

@Component({
  selector: 'app-opciones-operaciones',
  templateUrl: './opciones-operaciones.component.html',
  styleUrls: ['./opciones-operaciones.component.css']
})
export class OpcionesOperacionesComponent {
  options = [
    { name: 'Entrega de Vehículo al Conductor', icon: 'info', url: 'EntregaVehiculoConductor', disabled: false },
    { name: 'Generar Contrato y Declaración Jurada', icon: 'info', url: 'ContratoDeclaracionJurada', disabled: false },
    { name: 'Crear Cuenta de Diario al Conductor (Anticipo de Cuenta)', icon: 'info', url: 'CrearCuentaDiarioConductor', disabled: false },
    { name: 'Cambiar de Estado a un Vehículo', icon: 'info', url: 'CambiarEstadoVehiculo', disabled: false },
    { name: 'Cambiar de Patio a un Vehículo', icon: 'info', url: 'CambiarPatioVehiculo', disabled: false },
    { name: 'Prestamo de Vehículo al Conductor', icon: 'info', url: 'PrestamoVehiculoConductor', disabled: false },
    { name: 'Devolución de Vehículos Prestados', icon: 'info', url: 'DevolucionVehiculoPrestado', disabled: false },
    { name: 'Bajar Conductor del Vehículo (Culminación del Contrato)', icon: 'info', url: 'BajarConductorVehiculo', disabled: false },
    { name: 'Corregir Kilometraje Actual al Vehículo', icon: 'info', url: 'CorregirKilometrajeActualVehiculo', disabled: false },
    { name: 'Apertura de Cuenta por Cobrar a un Conductor', icon: 'info', url: 'AperturaCuentaCobrarConductor', disabled: false },
  ];

  selectOptionModal: string = '';

  entregaVehiculoConductor: boolean = false;

  constructor(
    private dialog: MatDialog,
    private breakpointObserver: BreakpointObserver
  ) { }

  ngOnInit(): void {
  }

  selectOption(option: string) {
    const isSmallScreen = this.breakpointObserver.isMatched(Breakpoints.Small);
    const isXsmallScreen = this.breakpointObserver.isMatched(Breakpoints.XSmall);
    const dialogWidth = isSmallScreen || isXsmallScreen ? '90vw' : '60%';

    switch (option) {
      case 'EntregaVehiculoConductor':
        this.entregaVehiculoConductor = true;
        this.selectOptionModal = option;
        document.documentElement.style.overflow = 'hidden';
        document.body.style.overflow = 'hidden';
        break;
      case 'ContratoDeclaracionJurada':
        this.dialog.open(OperacionesContratoDeclaracionJuradaComponent,
          {
            width: dialogWidth,
            disableClose: true,
          }
        );
        break;
      case 'CrearCuentaDiarioConductor':
        this.dialog.open(OperacionesCrearCuentaDiarioConductorComponent,
          {
            width: dialogWidth,
            disableClose: true,
          }
        );
        break;
      case 'CambiarEstadoVehiculo':
        this.dialog.open(OperacionesCambiarEstadoVehiculoComponent,
          {
            width: dialogWidth,
            disableClose: true,
          }
        );
        break;
      case 'CambiarPatioVehiculo':
        this.dialog.open(OperacionesCambiarPatioVehiculoComponent,
          {
            width: dialogWidth,
            disableClose: true,
          }
        );
        break;
      case 'PrestamoVehiculoConductor':
        this.dialog.open(OperacionesPrestamoVehiculoConductorComponent,
          {
            width: dialogWidth,
            disableClose: true,
          }
        )
        break;
      case 'DevolucionVehiculoPrestado':
        this.dialog.open(OperacionesDevolucionVehiculoPrestadoComponent,
          {
            width: dialogWidth,
            disableClose: true,
          }
        )
        break;
      case 'BajarConductorVehiculo':
        this.dialog.open(OperacionesBajarConductorVehiculoComponent,
          {
            width: dialogWidth,
            disableClose: true,
          }
        );
        break;
      case 'CorregirKilometrajeActualVehiculo':
        this.dialog.open(OperacionesCorregirKilometrajeActualComponent,
          {
            width: dialogWidth,
            disableClose: true,
          }
        );
        break;
      case 'AperturaCuentaCobrarConductor':
        this.dialog.open(OperacionesAperturaCobrarConductorComponent,
          {
            width: dialogWidth,
            disableClose: true,
          }
        );
        break;
    }
  }

  hideModal() {
    switch (this.selectOptionModal) {
      case 'EntregaVehiculoConductor':
        this.entregaVehiculoConductor = false;
        document.documentElement.style.overflow = '';
        document.body.style.overflow = '';
        break;
    }
  }
}
