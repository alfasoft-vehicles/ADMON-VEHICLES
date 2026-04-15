import { Component } from '@angular/core';

@Component({
  selector: 'app-cash-register-view',
  templateUrl: './cash-register-view.component.html',
  styleUrls: ['./cash-register-view.component.css'],
})
export class CashRegisterViewComponent {
  // Variables de Búsqueda
  searchCodigo: string = '';
  searchUnidad: string = '';
  hasData: boolean = false;

  // Variables del Formulario de Pago
  formaPago: string = 'efectivo';
  pagoRenta: number = 0;
  pagoSiniestros: number = 0;
  pagoRecargos: number = 0;
  pagoInscripcion: number = 0;
  pagoAhorros: number = 0;
  totalRecibido: number = 0;

  buscar() {
    if (this.searchCodigo || this.searchUnidad === '0363') {
      this.hasData = true;
      this.pagoRenta = 35.0;
      this.calcularTotal();
    }
  }

  limpiar() {
    this.hasData = false;
    this.searchCodigo = '';
    this.searchUnidad = '';
    this.pagoRenta = 0;
    this.pagoSiniestros = 0;
    this.pagoRecargos = 0;
    this.pagoInscripcion = 0;
    this.pagoAhorros = 0;
    this.calcularTotal();
  }

  calcularTotal() {
    this.totalRecibido =
      (this.pagoRenta || 0) +
      (this.pagoSiniestros || 0) +
      (this.pagoRecargos || 0) +
      (this.pagoInscripcion || 0) +
      (this.pagoAhorros || 0);
  }
}
