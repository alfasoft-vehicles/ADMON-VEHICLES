import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from 'src/app/services/api.service';
import { JwtService } from 'src/app/services/jwt.service';

@Component({
  selector: 'app-owners-reports',
  templateUrl: './owners-reports.component.html',
  styleUrls: ['./owners-reports.component.css']
})
export class OwnersReportsComponent implements OnInit {
  @Input() isVisible: boolean = false;
  @Output() close = new EventEmitter<void>();
  titles: { [key: string]: string } = {
    'EstadoFlotaResumen': 'Informe Resumen de Vehículos',
    'EstadoFlotaDetalle': 'Informe Detalle de Vehículos',
    'ValoresCompra': 'Informe Valores de Compra'
  };

  externalLinks:  { [key: string]: string } = {
    'EstadoFlotaResumen': 'estado-vehiculos-resumen-empresa/',
    'EstadoFlotaDetalle': 'informe-estados-detallado-empresa/',
    'ValoresCompra': 'valor-compra-vehiculos'
  };

  owners: any[] = [];
  states: any[] = [];
  empresasSeleccionadas: string[] = [];
  estadosSeleccionados: string[] = [];
  selectedOption: string = '';
  selectedCompany: string = '';
  companySelected: boolean = false;
  statesDisplay: boolean = false;
  optionsDisplay: boolean = true;
  user: any;

  constructor(
    private router: Router, 
    private apiService: ApiService, 
    private jwtService: JwtService
  ) { }

  ngOnInit(): void {
    this.listOwners();
    this.listStates();
    this.getUser();
  }

  getUser() {
    this.user = this.jwtService.getUserData();
    this.user = this.user.nombre;
  }

  getCompany() {
    const userData = this.jwtService.getUserData();
    return userData ? userData.empresa : '';
  }

  listOwners(): void {
    this.apiService.getData("owners").subscribe(
      (response) => {
        this.owners = response.filter((owner: any) => owner.id);
        this.owners.sort((a, b) => a.name.localeCompare(b.name));
      },
      (error) => {
      }
    );
  }

  listStates(): void {
    const company = this.getCompany();
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

  selected(option: string): void {
    this.selectedOption = option;
    if(option === 'EstadoFlotaResumen' || option === 'EstadoFlotaDetalle') {
      this.optionsDisplay = false;
      this.companySelected = true;
    }
    else {
      this.optionsDisplay = false;
    }
  }

  onCompanyChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    this.selectedCompany = selectElement.value;
    this.openExternalLink()
  }

  openExternalLink(): void {
    let endpoint = this.externalLinks[this.selectedOption];
    endpoint += this.selectedCompany;
    if (endpoint) {
      const data = { user: this.user };
      localStorage.setItem('pdfEndpoint', endpoint);
      localStorage.setItem('pdfData', JSON.stringify(data));
      window.open(`/pdf`, '_blank')
      this.resetValues()
      this.router.navigate(['/home/users']);
    } else {
      console.error('URL no encontrada para la opción seleccionada.');
    }
  }

  isEmpresaSeleccionada(opcionId: string): boolean {
    return this.empresasSeleccionadas.includes(opcionId);
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

  onCheckboxEmpresaContainerClick(opcionId: string, event: any) {
    const checkbox = event.currentTarget.querySelector('input[type="checkbox"]');
    checkbox.checked = !checkbox.checked;
    this.onCheckboxEmpresaChange(opcionId, { target: checkbox });
    event.stopPropagation(); // Evita que el evento de clic se propague
  }

  onEmpresaSeleccionar() {
    this.empresasSeleccionadas.sort((a, b) => parseInt(a) - parseInt(b));
    this.statesDisplay = true;
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

  onCheckboxEstadoContainerClick(opcionId: string, event: any) {
    const checkbox = event.currentTarget.querySelector('input[type="checkbox"]');
    checkbox.checked = !checkbox.checked;
    this.onCheckboxEstadoChange(opcionId, { target: checkbox });
    event.stopPropagation(); // Evita que el evento de clic se propague
  }

  isEstadoSeleccionado(opcionId: string): boolean {
    return this.estadosSeleccionados.includes(opcionId);
  }

  onEstadoSeleccionar() {
    this.estadosSeleccionados.sort((a, b) => parseInt(a) - parseInt(b));
    this.generarInforme();
  }

  obtenerIdsEmpresas(): string[] {
    return this.owners.map(owner => owner.id).filter(id => id);
  }

  obtenerIdsEstados(): string[] {
    return this.states.map(state => state.id).filter(id => id);
  }

  generarInforme() {
    if(this.empresasSeleccionadas.length == 0) {
      this.empresasSeleccionadas = this.obtenerIdsEmpresas();
    }
    if(this.estadosSeleccionados.length == 0) {
      this.estadosSeleccionados = this.obtenerIdsEstados();
    }
    let info = {
      usuario: this.user,
      empresas: this.empresasSeleccionadas,
      estados: this.estadosSeleccionados
    }

    let endpoint = this.externalLinks[this.selectedOption];
    
    // Guardar endpoint y data en LocalStorage
    localStorage.setItem('pdfEndpoint', endpoint);
    localStorage.setItem('pdfData', JSON.stringify(info));

    // Navegar al componente PdfViewerComponent
    window.open(`/pdf`, '_blank')
    this.router.navigate(['/home/users']);
  }

  backStates(): void {
    this.statesDisplay = false;
    this.estadosSeleccionados = [];
  }

  resetValues(): void {
    this.selectedOption = '';
    this.selectedCompany = '';
    this.optionsDisplay = true;
    this.companySelected = false;
    this.statesDisplay = false;
    this.empresasSeleccionadas = [];
    this.estadosSeleccionados = [];
  }

  closeModal() {
    this.close.emit();
    this.resetValues()
  }
}