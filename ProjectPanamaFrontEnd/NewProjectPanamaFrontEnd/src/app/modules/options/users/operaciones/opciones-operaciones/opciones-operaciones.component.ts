import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { OperacionesContratoDeclaracionJuradaComponent } from '../operaciones-contrato-declaracion-jurada/operaciones-contrato-declaracion-jurada.component';
import { OperacionesCrearCuentaDiarioConductorComponent } from '../operaciones-crear-cuenta-diario-conductor/operaciones-crear-cuenta-diario-conductor.component';
import { OperacionesCambiarEstadoVehiculoComponent } from '../operaciones-cambiar-estado-vehiculo/operaciones-cambiar-estado-vehiculo.component';
import { OperacionesCambiarPatioVehiculoComponent } from '../operaciones-cambiar-patio-vehiculo/operaciones-cambiar-patio-vehiculo.component';
import { OperacionesCorregirKilometrajeActualComponent } from '../operaciones-corregir-kilometraje-actual/operaciones-corregir-kilometraje-actual.component';
import { OperacionesPrestamoVehiculoConductorComponent } from '../operaciones-prestamo-vehiculo-conductor/operaciones-prestamo-vehiculo-conductor.component';
import { OperacionesDevolucionVehiculoPrestadoComponent } from '../operaciones-devolucion-vehiculo-prestado/operaciones-devolucion-vehiculo-prestado.component';
import { OperacionesBajarConductorVehiculoComponent } from '../operaciones-bajar-conductor-vehiculo/operaciones-bajar-conductor-vehiculo.component';
import { OperacionesAperturaCobrarConductorComponent } from '../operaciones-apertura-cobrar-conductor/operaciones-apertura-cobrar-conductor.component';

interface OperationItem {
  name: string;
  icon: string;
  actionCode: string;
}

@Component({
  selector: 'app-opciones-operaciones',
  templateUrl: './opciones-operaciones.component.html',
  styleUrls: ['./opciones-operaciones.component.css']
})
export class OpcionesOperacionesComponent implements OnInit {
  
  options: OperationItem[] = [
    { name: 'Entrega de Vehículo al Conductor', icon: 'directions_car', actionCode: 'EntregaVehiculoConductor' },
    { name: 'Generar Contrato y Declaración Jurada', icon: 'history_edu', actionCode: 'ContratoDeclaracionJurada' },
    { name: 'Crear Cuenta de Diario al Conductor (Anticipo de Cuenta)', icon: 'account_balance_wallet', actionCode: 'CrearCuentaDiarioConductor' },
    { name: 'Cambiar de Estado a un Vehículo', icon: 'build_circle', actionCode: 'CambiarEstadoVehiculo' },
    { name: 'Cambiar de Patio a un Vehículo', icon: 'local_parking', actionCode: 'CambiarPatioVehiculo' },
    { name: 'Prestamo de Vehículo al Conductor', icon: 'car_rental', actionCode: 'PrestamoVehiculoConductor' },
    { name: 'Devolución de Vehículos Prestados', icon: 'assignment_return', actionCode: 'DevolucionVehiculoPrestado' },
    { name: 'Bajar Conductor del Vehículo (Culminación del Contrato)', icon: 'person_remove', actionCode: 'BajarConductorVehiculo' },
    { name: 'Corregir Kilometraje Actual al Vehículo', icon: 'speed', actionCode: 'CorregirKilometrajeActualVehiculo' },
    { name: 'Apertura de Cuenta por Cobrar a un Conductor', icon: 'request_quote', actionCode: 'AperturaCuentaCobrarConductor' }
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
        this.dialog.open(OperacionesContratoDeclaracionJuradaComponent, { width: dialogWidth, disableClose: true });
        break;
      case 'CrearCuentaDiarioConductor':
        this.dialog.open(OperacionesCrearCuentaDiarioConductorComponent, { width: dialogWidth, disableClose: true });
        break;
      case 'CambiarEstadoVehiculo':
        this.dialog.open(OperacionesCambiarEstadoVehiculoComponent, { width: dialogWidth, disableClose: true });
        break;
      case 'CambiarPatioVehiculo':
        this.dialog.open(OperacionesCambiarPatioVehiculoComponent, { width: dialogWidth, disableClose: true });
        break;
      case 'PrestamoVehiculoConductor':
        this.dialog.open(OperacionesPrestamoVehiculoConductorComponent, { width: dialogWidth, disableClose: true });
        break;
      case 'DevolucionVehiculoPrestado':
        this.dialog.open(OperacionesDevolucionVehiculoPrestadoComponent, { width: dialogWidth, disableClose: true });
        break;
      case 'BajarConductorVehiculo':
        this.dialog.open(OperacionesBajarConductorVehiculoComponent, { width: dialogWidth, disableClose: true });
        break;
      case 'CorregirKilometrajeActualVehiculo':
        this.dialog.open(OperacionesCorregirKilometrajeActualComponent, { width: dialogWidth, disableClose: true });
        break;
      case 'AperturaCuentaCobrarConductor':
        this.dialog.open(OperacionesAperturaCobrarConductorComponent, { width: dialogWidth, disableClose: true });
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
