import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from 'src/app/services/api.service';
import { JwtService } from 'src/app/services/jwt.service';

@Component({
  selector: 'app-feespaid',
  templateUrl: './feespaid.component.html',
  styleUrls: ['./feespaid.component.css']
})
export class FeespaidComponent implements OnInit {
  constructor(
    private apiService: ApiService, 
    private jwtService: JwtService, 
    private router: Router) { }

  owners: any[] = [];
  states: any[] = [];

  empresasSeleccionadas: string[] = [];
  mostrarOpcionesEmpresas: boolean = false;
  mostrarOpcionesPorNombre: boolean = false;
  mostrarOpcionesPorCodigo: boolean = false;
  selectedEmpresasOptions: { [key: string]: boolean } = {};

  estadosSeleccionados: string[] = [];
  mostrarOpcionesEstados: boolean = false;
  selectedEstadosOptions: { [key: string]: boolean } = {};

  isLoading: boolean = false;

  ngOnInit(): void {
    this.listOwners();
    this.listStates();
  }

  obtenerUsuario() {
    let user = this.jwtService.getUserData();
    return user ? user.nombre : ''; // Si 'user' existe, devuelve 'user.nombre', si no, devuelve un string vacío.
  }

  getCompany() {
    const userData = this.jwtService.getUserData();
    return userData ? userData.empresa : '';
  }

  listOwners(): void {
    let company = this.getCompany();
    this.apiService.getData("owners/"+company).subscribe(
      (response) => {
        this.owners = response.filter((owner: any) => owner.id);
        this.owners.sort((a, b) => a.name.localeCompare(b.name));
      },
      (error) => {
        console.error(error);
      }
    );
  }

  listStates(): void {
    let company = this.getCompany();
    this.apiService.getData("states/"+company).subscribe(
      (response) => {
        this.states = response.filter((state: any) => state.id);
        this.states.sort((a, b) => {
          const aStartsWithSpecialChar = a.name.startsWith('»');
          const bStartsWithSpecialChar = b.name.startsWith('»');
        
          if (aStartsWithSpecialChar && !bStartsWithSpecialChar) {
            return 1;
          }
          if (!aStartsWithSpecialChar && bStartsWithSpecialChar) {
            return -1;
          }
        
          return a.name.localeCompare(b.name);
        });
      },
      (error) => {
        console.error(error);
      }
    );
  }

  backOptions() {
    if (this.mostrarOpcionesEmpresas) {
      this.mostrarOpcionesEmpresas = !this.mostrarOpcionesEmpresas;
      this.toggleEmpresaSelect('empresas');
      this.empresasSeleccionadas = [];
      this.clearEmpresasSelections();
    }
    if (this.mostrarOpcionesEstados) {
      this.mostrarOpcionesEstados = !this.mostrarOpcionesEstados;
      this.toggleEstadoSelect('estados');
      this.estadosSeleccionados = [];
      this.clearEstadosSelections();
    }
  }

  // EMPRESA
  // -----------------------------------------------------------------------
  toggleOpcionesEmpresas() {
    this.mostrarOpcionesEmpresas = !this.mostrarOpcionesEmpresas;
    this.mostrarOpcionesPorNombre = false;
    this.mostrarOpcionesPorCodigo = false;
    this.toggleEmpresaSelect('empresas');
    if (!this.mostrarOpcionesEmpresas) {
      this.clearEmpresasSelections();
      this.onEmpresaSeleccionar();
    }
  }

  toggleOpcionesPorNombre() {
    this.mostrarOpcionesPorNombre = !this.mostrarOpcionesPorNombre;
    this.mostrarOpcionesPorCodigo = false;
    this.toggleEmpresaSelect('nombre');
    if (this.mostrarOpcionesPorNombre) {
      this.owners.sort((a, b) => a.name.localeCompare(b.name)); // Orden ascendente por nombre
    }
  }

  toggleOpcionesPorCodigo() {
    this.mostrarOpcionesPorCodigo = !this.mostrarOpcionesPorCodigo;
    this.mostrarOpcionesPorNombre = false;
    this.toggleEmpresaSelect('codigo');
    if (this.mostrarOpcionesPorCodigo) {
      this.owners.sort((a, b) => parseInt(a.id) - parseInt(b.id)); // Orden ascendente por código
    }
  }

  toggleEmpresaSelect(option: string) {
    this.selectedEmpresasOptions[option] = !this.selectedEmpresasOptions[option];
  }

  onCheckboxEmpresaChange(opcionId: string, event: any) {
    if (event.target.checked) {
      if (!this.empresasSeleccionadas.includes(opcionId)) {
        this.empresasSeleccionadas.push(opcionId);
      }
    } else {
      this.empresasSeleccionadas = this.empresasSeleccionadas.filter(id => id !== opcionId);
    }
  }

  isEmpresaSeleccionada(opcionId: string): boolean {
    return this.empresasSeleccionadas.includes(opcionId);
  }

  onEmpresaSeleccionar() {
    this.empresasSeleccionadas.sort((a, b) => parseInt(a) - parseInt(b));
    this.mostrarOpcionesEmpresas = false; // Cierra el cuadro después de la selección
    this.clearEmpresasSelections();
  }

  clearEmpresasSelections() {
    this.selectedEmpresasOptions = {};
  }

  onCheckboxEmpresaContainerClick(opcionId: string, event: any) {
    const checkbox = event.currentTarget.querySelector('input[type="checkbox"]');
    checkbox.checked = !checkbox.checked;
    this.onCheckboxEmpresaChange(opcionId, { target: checkbox });
    event.stopPropagation(); // Evita que el evento de clic se propague
  }
  // -----------------------------------------------------------------------

  // ESTADOS
  // -----------------------------------------------------------------------
  toggleOpcionesEstados() {
    this.mostrarOpcionesEstados = !this.mostrarOpcionesEstados;
    this.toggleEstadoSelect('estados');
    if (!this.mostrarOpcionesEstados) {
      this.clearEstadosSelections();
      this.onEstadoSeleccionar();
    }
  }

  toggleEstadoSelect(option: string) {
    this.selectedEstadosOptions[option] = !this.selectedEstadosOptions[option];
  }

  onCheckboxEstadoChange(opcionId: string, event: any) {
    if (event.target.checked) {
      if (!this.estadosSeleccionados.includes(opcionId)) {
        this.estadosSeleccionados.push(opcionId);
      }
    } else {
      this.estadosSeleccionados = this.estadosSeleccionados.filter(id => id !== opcionId);
    }
  }

  isEstadoSeleccionado(opcionId: string): boolean {
    return this.estadosSeleccionados.includes(opcionId);
  }

  onEstadoSeleccionar() {
    this.estadosSeleccionados.sort((a, b) => parseInt(a) - parseInt(b));
    this.mostrarOpcionesEstados = false; 
    this.clearEstadosSelections();
  }

  clearEstadosSelections() {
    this.selectedEstadosOptions = {};
  }

  onCheckboxEstadoContainerClick(opcionId: string, event: any) {
    const checkbox = event.currentTarget.querySelector('input[type="checkbox"]');
    checkbox.checked = !checkbox.checked;
    this.onCheckboxEstadoChange(opcionId, { target: checkbox });
    event.stopPropagation(); // Evita que el evento de clic se propague
  }
  // -----------------------------------------------------------------------

  obtenerIdsEmpresas(): string[] {
    return this.owners.map(owner => owner.id).filter(id => id);
  }

  obtenerIdsEstados(): string[] {
    return this.states.map(state => state.id).filter(id => id);
  }

  // Generar informe y mostrar el PDF
  generarInforme() {
    this.isLoading = true;
    let user = this.obtenerUsuario();
    if (this.empresasSeleccionadas.length === 0) {
      this.empresasSeleccionadas = this.obtenerIdsEmpresas();
    }
    if (this.estadosSeleccionados.length === 0) {
      this.estadosSeleccionados = this.obtenerIdsEstados();
    }
    let info = {
      usuario: user,
      empresas: this.empresasSeleccionadas,
      estados: this.estadosSeleccionados
    };

    const endpoint = 'informe-cuotas-pagas/'+this.getCompany();

    // Guardar endpoint y data en LocalStorage
    localStorage.setItem('pdfEndpoint', endpoint);
    localStorage.setItem('pdfData', JSON.stringify(info));

    // Navegar al componente PdfViewerComponent
    window.open(`/pdf`, '_blank')
    this.router.navigate(['/home/users']);
  }

}
